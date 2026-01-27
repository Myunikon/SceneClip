
import { StateCreator } from 'zustand'
import { AppState, DownloadTask, VideoSlice } from './types'
import { v4 as uuidv4 } from 'uuid'
import { Command } from '@tauri-apps/plugin-shell'

// Import Helper Libs
import { notify } from '../../lib/notify'
import { getUniqueFilePath, saveTempCookieFile } from '../../lib/fileUtils'
import { DownloadService } from '../../lib/DownloadService'
import {
    parseFFmpegProgress,
    parseFFmpegDuration,
    buildCompressionArgs,
    buildCompressedOutputPath,
    detectFileType
} from '../../lib/ffmpegService'
import { stat } from '@tauri-apps/plugin-fs'
import { BINARIES } from '../../lib/constants'

// Import Extracted Services
import {
    formatBytes,
    activeProcessMap,
    startingTaskIds,
    cleanupTask
} from '../../lib/processUtils'


export const createVideoSlice: StateCreator<AppState, [], [], VideoSlice> = (set, get) => {

    // We can inject context here if needed, or just use get() inside callbacks

    return {
        tasks: [],

        addTask: async (url, options) => {
            const id = uuidv4()
            const settings = get().settings

            // Prevent duplicate downloads
            const existingTask = get().tasks.find(t =>
                t.url === url &&
                (t.status === 'downloading' || t.status === 'fetching_info' || t.status === 'queued')
            )
            if (existingTask) {
                get().addLog({ message: `[Queue] Duplicate URL ignored: ${url}`, type: 'warning' })
                return
            }

            // Handle Cookie File Creation
            let cookiePath = undefined
            if (options?.cookies) {
                try {
                    // Primitive check: if it looks like Netscape content, save to file
                    if (options.cookies.includes("Netscape")) {
                        cookiePath = await saveTempCookieFile(options.cookies, id)
                    } else {
                        cookiePath = options.cookies
                    }
                } catch (e) {
                    get().addLog({ message: `Failed to save cookie file: ${e}`, type: 'error' })
                }
            }

            const newTask: DownloadTask = {
                id,
                url,
                title: 'Queueing...',
                status: options.scheduledTime ? 'scheduled' : 'pending',
                progress: 0,
                speed: '-',
                eta: '-',
                range: (options.rangeStart || options.rangeEnd) ? `${options.rangeStart || 0}-${options.rangeEnd || ''}` : 'Full',
                format: options.format || settings.resolution,
                path: options.path || settings.downloadPath,
                scheduledTime: options.scheduledTime,
                _options: {
                    ...options,
                    cookies: cookiePath,
                    postProcessorArgs: options.postProcessorArgs
                },
                addedAt: Date.now()
            }

            set(state => ({ tasks: [newTask, ...state.tasks] }))
            get().processQueue()
        },

        processQueue: () => {
            const { tasks, settings, startTask } = get()
            const activeCount = tasks.filter(t =>
                t.status === 'downloading' ||
                t.status === 'fetching_info' ||
                t.status === 'processing' ||
                startingTaskIds.has(t.id)
            ).length
            const limit = settings.concurrentDownloads || 3

            if (activeCount < limit) {
                const pending = tasks.find(t =>
                    t.status === 'pending' && !startingTaskIds.has(t.id)
                )
                if (pending) {
                    startingTaskIds.add(pending.id)
                    startTask(pending.id)
                }
            }
        },

        startTask: async (id) => {
            const { tasks, updateTask } = get()
            const task = tasks.find(t => t.id === id)
            if (!task) {
                cleanupTask(id)
                return
            }

            updateTask(id, { status: 'fetching_info' })
            startingTaskIds.delete(id)

            // Delegate to DownloadService
            const service = DownloadService.getInstance()

            await service.start(task, get().settings, {
                onLog: (taskId, message, type) => {
                    get().addLog({ message: `[${taskId.substring(0, 4)}] ${message}`, type: type || 'info' })
                    if (type === 'error') updateTask(taskId, { log: message })
                },
                onProgress: (taskId, updates) => {
                    updateTask(taskId, updates)
                },
                onError: (taskId, error) => {
                    const { tasks, updateTask, processQueue, addLog } = get()
                    const task = tasks.find(t => t.id === taskId)

                    // Transient error patterns that can be auto-retried
                    const transientPatterns = [
                        'timeout', 'etimedout', 'econnreset', 'econnrefused',
                        'socket hang up', 'network', 'enotfound', 'epipe',
                        'unable to download', 'http error 5', // 5xx server errors
                        'connection reset', 'interrupted'
                    ]

                    const isTransientError = transientPatterns.some(pattern =>
                        error.toLowerCase().includes(pattern)
                    )

                    const currentRetryCount = task?.retryCount || 0
                    const maxRetries = 3

                    if (isTransientError && currentRetryCount < maxRetries) {
                        // Exponential backoff: 2s, 4s, 8s
                        const delay = Math.pow(2, currentRetryCount + 1) * 1000
                        const nextRetry = currentRetryCount + 1

                        addLog({
                            message: `[${taskId.substring(0, 4)}] Transient error detected. Auto-retry ${nextRetry}/${maxRetries} in ${delay / 1000}s...`,
                            type: 'warning'
                        })

                        updateTask(taskId, {
                            status: 'pending',
                            progress: 0,
                            retryCount: nextRetry,
                            speed: `Retry ${nextRetry}/${maxRetries}...`,
                            eta: `${delay / 1000}s`,
                            log: `Auto-retry: ${error}`
                        })

                        // Schedule retry after delay
                        setTimeout(() => {
                            const { tasks, processQueue } = get()
                            const currentTask = tasks.find(t => t.id === taskId)
                            // Only retry if still in pending state (not manually stopped)
                            if (currentTask?.status === 'pending') {
                                processQueue()
                            }
                        }, delay)
                    } else {
                        // Permanent error or max retries exceeded
                        if (currentRetryCount >= maxRetries) {
                            addLog({
                                message: `[${taskId.substring(0, 4)}] Max retries (${maxRetries}) exceeded. Marking as failed.`,
                                type: 'error'
                            })
                        }
                        updateTask(taskId, { status: 'error', log: error })
                        processQueue()
                    }
                },
                onComplete: async (taskId, result) => {
                    updateTask(taskId, {
                        status: 'completed',
                        progress: 100,
                        filePath: result.path,
                        completedAt: Date.now()
                    })

                    get().addLog({ message: `Task ${taskId} Completed. Path: ${result.path}`, type: 'success' })

                    // Trigger next in queue
                    get().processQueue()

                    // Send desktop notification (if enabled)
                    const task = get().tasks.find(t => t.id === taskId)
                    if (get().settings.enableDesktopNotifications && task) {
                        import('../../lib/notificationService').then(({ notificationService }) => {
                            notificationService.notifyDownloadComplete(task.title, result.path)
                        })
                    }

                    // Check for post-download action when queue is empty
                    const { tasks, settings } = get()
                    const hasActiveDownloads = tasks.some(t =>
                        t.status === 'downloading' ||
                        t.status === 'fetching_info' ||
                        t.status === 'pending' ||
                        t.status === 'queued' ||
                        t.status === 'processing'
                    )

                    if (!hasActiveDownloads && settings.postDownloadAction && settings.postDownloadAction !== 'none') {
                        // Send batch complete notification
                        if (settings.enableDesktopNotifications) {
                            const completedCount = tasks.filter(t => t.status === 'completed').length
                            import('../../lib/notificationService').then(({ notificationService }) => {
                                notificationService.notifyBatchComplete(completedCount)
                            })
                        }

                        try {
                            const { invoke } = await import('@tauri-apps/api/core')
                            notify.info('All downloads complete', {
                                description: `Performing action: ${settings.postDownloadAction}`,
                                duration: 5000
                            })
                            // Delay to allow notification to show
                            setTimeout(async () => {
                                await invoke('perform_system_action', {
                                    action: settings.postDownloadAction,
                                    confirm: true
                                })
                            }, 3000)
                        } catch (e) {
                            notify.error('Failed to perform post-download action', { description: String(e) })
                        }
                    }
                },
                onCommand: (taskId, command) => {
                    updateTask(taskId, { ytdlpCommand: command })
                }
            })
        },

        stopTask: async (id) => {
            const service = DownloadService.getInstance()
            await service.stop(id)
            get().updateTask(id, { status: 'stopped', speed: '-', eta: 'Stopped' })
        },

        pauseTask: async (id) => {
            const service = DownloadService.getInstance()
            await service.pause(id)
            get().updateTask(id, { status: 'paused', speed: 'Paused', eta: '-' })
        },

        resumeTask: async (id) => {
            const { updateTask, processQueue } = get()
            updateTask(id, { status: 'pending' }) // Re-queue
            processQueue()
        },

        retryTask: async (id) => {
            const { updateTask, processQueue } = get()
            // Reset retryCount on manual retry for fresh auto-retry attempts
            updateTask(id, { status: 'pending', progress: 0, speed: 'Retrying...', eta: '...', log: undefined, retryCount: 0 })
            processQueue()
        },

        clearTask: (id) => {
            const { stopTask } = get()
            stopTask(id)
            set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }))
        },

        deleteHistory: () => {
            set(state => ({ tasks: state.tasks.filter(t => t.status !== 'completed' && t.status !== 'stopped') }))
        },

        importTasks: (importedTasks) => {
            set(state => {
                const existingIds = new Set(state.tasks.map(t => t.id))
                const newTasks = importedTasks.filter(t => !existingIds.has(t.id))
                return { tasks: [...state.tasks, ...newTasks] }
            })
        },

        updateTask: (id, updates) => {
            set(state => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
            }))
        },

        // --- Compression Logic (Basic Re-impl) ---
        compressTask: async (taskId, options) => {
            const { tasks, updateTask, settings } = get()
            const originalTask = tasks.find(t => t.id === taskId)
            if (!originalTask || !originalTask.filePath) return

            const fileType = detectFileType(originalTask.filePath)
            let outputPath = buildCompressedOutputPath(originalTask.filePath)

            try {
                outputPath = await getUniqueFilePath(outputPath)
            } catch { /* ignore */ }

            const args = buildCompressionArgs(originalTask.filePath, outputPath, options, fileType)
            const newId = uuidv4()

            const newTask: DownloadTask = {
                id: newId,
                url: originalTask.filePath,
                title: `Compressing: ${originalTask.title}`,
                status: 'downloading',
                statusDetail: 'Initializing...',
                progress: 0,
                speed: '0',
                eta: '...',
                path: settings.downloadPath,
                addedAt: Date.now()
            }

            set(state => ({ tasks: [newTask, ...state.tasks] }))

            // Spawn FFmpeg Sidecar
            try {
                const cmd = Command.sidecar(BINARIES.FFMPEG, args)
                let durationSec = 0

                cmd.stderr.on('data', (line) => {
                    const str = typeof line === 'string' ? line : new TextDecoder().decode(line)
                    const dur = parseFFmpegDuration(str)
                    if (dur) durationSec = dur

                    const prog = parseFFmpegProgress(str, durationSec)
                    if (prog) updateTask(newId, { progress: prog.percent, speed: prog.speed, eta: prog.eta })
                })

                const child = await cmd.spawn()
                activeProcessMap.set(newId, child)

                updateTask(newId, { pid: child.pid, statusDetail: 'Encoding' })

                cmd.on('close', async (data) => {
                    activeProcessMap.delete(newId)
                    if (data.code === 0) {
                        let sizeBytes = 0
                        try {
                            const s = await stat(outputPath)
                            sizeBytes = s.size
                        } catch { /* ignore */ }
                        updateTask(newId, {
                            status: 'completed',
                            progress: 100,
                            filePath: outputPath,
                            fileSize: formatBytes(sizeBytes),
                            completedAt: Date.now()
                        })
                        notify.success("Compression Complete", { description: newTask.title })
                    } else {
                        updateTask(newId, { status: 'error', log: `Exit Code ${data.code}` })
                    }
                })

            } catch (e) {
                updateTask(newId, { status: 'error', log: String(e) })
            }
        },

        sanitizeTasks: () => {
            set(state => ({
                tasks: state.tasks.map(t => {
                    if (t.status === 'fetching_info' || t.status === 'downloading') {
                        return { ...t, status: 'stopped', statusDetail: 'Interrupted by Restart' }
                    }
                    return t
                })
            }))
        },

        /**
         * Recover interrupted downloads (Parabolic feature)
         * Re-queues all stopped/interrupted tasks for retry
         * @returns Number of tasks recovered
         */
        recoverDownloads: () => {
            const { tasks, processQueue } = get()
            const interruptedTasks = tasks.filter(t =>
                t.status === 'stopped' &&
                t.statusDetail === 'Interrupted by Restart'
            )

            if (interruptedTasks.length === 0) return 0

            // Re-queue interrupted tasks
            set(state => ({
                tasks: state.tasks.map(t => {
                    if (t.status === 'stopped' && t.statusDetail === 'Interrupted by Restart') {
                        return {
                            ...t,
                            status: 'pending',
                            statusDetail: 'Recovered',
                            progress: 0,
                            speed: 'Queued...',
                            eta: '-'
                        }
                    }
                    return t
                })
            }))

            // Start processing queue
            processQueue()

            get().addLog({
                translationKey: 'recoveredDownloads',
                params: { count: interruptedTasks.length },
                type: 'success'
            })

            return interruptedTasks.length
        },

        /**
         * Retry all failed/error tasks (Parabolic feature)
         * Batch retry for all tasks with error status
         */
        retryAllFailed: () => {
            const { tasks, processQueue } = get()
            const failedTasks = tasks.filter(t => t.status === 'error')

            if (failedTasks.length === 0) return

            set(state => ({
                tasks: state.tasks.map(t => {
                    if (t.status === 'error') {
                        return {
                            ...t,
                            status: 'pending',
                            progress: 0,
                            speed: 'Retrying...',
                            eta: '-',
                            log: undefined
                        }
                    }
                    return t
                })
            }))

            processQueue()

            get().addLog({
                translationKey: 'retryingAllFailed',
                params: { count: failedTasks.length },
                type: 'info'
            })
        },

        /**
         * Get count of interrupted tasks that can be recovered
         */
        getInterruptedCount: () => {
            return get().tasks.filter(t =>
                t.status === 'stopped' &&
                t.statusDetail === 'Interrupted by Restart'
            ).length
        },

        /**
         * Cleanup old completed/stopped tasks based on retention policy
         * Uses immutable filter pattern per Context7/Zustand best practices
         * 
         * @param retentionDays - Days to keep tasks (-1 = forever, 0 = delete all)
         * @see Context7: "prefer immutable operations like filter(...)"
         */
        /**
         * Cleanup old completed/stopped tasks based on retention policy
         * Supports both Time-based (Days) and Count-based (Max Items) retention
         */
        cleanupOldTasks: (retentionDays: number) => {
            const { settings } = get()
            const maxItems = settings.maxHistoryItems ?? -1

            set(state => {
                let currentTasks = [...state.tasks]

                // 1. Time-based Retention
                if (retentionDays === 0) {
                    currentTasks = currentTasks.filter(t => !['completed', 'stopped'].includes(t.status))
                } else if (retentionDays > 0) {
                    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
                    currentTasks = currentTasks.filter(t => {
                        if (!['completed', 'stopped'].includes(t.status)) return true
                        const taskTime = t.completedAt || t.addedAt || 0
                        return taskTime > cutoffTime
                    })
                }

                // 2. Count-based Retention (Max Items)
                if (maxItems >= 0) {
                    const activeTasks = currentTasks.filter(t => !['completed', 'stopped'].includes(t.status))
                    const historyTasks = currentTasks.filter(t => ['completed', 'stopped'].includes(t.status))

                    // Sort history by date desc (newest first)
                    historyTasks.sort((a, b) => {
                        const timeA = a.completedAt || a.addedAt || 0
                        const timeB = b.completedAt || b.addedAt || 0
                        return timeB - timeA
                    })

                    // Keep only top N
                    if (historyTasks.length > maxItems) {
                        const keptHistory = historyTasks.slice(0, maxItems)
                        currentTasks = [...activeTasks, ...keptHistory]
                    }
                }

                return { tasks: currentTasks }
            })
        }
    }
}
