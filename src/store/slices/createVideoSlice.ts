
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
                    cookies: cookiePath
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
                    updateTask(taskId, { status: 'error', log: error })
                    get().processQueue()
                },
                onComplete: async (taskId, result) => {
                    updateTask(taskId, {
                        status: 'completed',
                        progress: 100,
                        filePath: result.path,
                        completedAt: Date.now()
                    })

                    get().addLog({ message: `Task ${taskId} Completed. Path: ${result.path}`, type: 'success' })

                    // Trigger Compression if needed
                    get().processQueue()
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
            await service.stop(id)
            get().updateTask(id, { status: 'paused', speed: 'Paused', eta: '-' })
        },

        resumeTask: async (id) => {
            const { updateTask, processQueue } = get()
            updateTask(id, { status: 'pending' }) // Re-queue
            processQueue()
        },

        retryTask: async (id) => {
            const { updateTask, processQueue } = get()
            // Simply re-queue for retry
            updateTask(id, { status: 'pending', progress: 0, speed: 'Retrying...', eta: '...', log: undefined })
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
        }
    }
}
