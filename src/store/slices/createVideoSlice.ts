
import { StateCreator } from 'zustand'
import { AppState, DownloadTask, VideoSlice } from './types'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { buildCompressedOutputPath } from '../../lib/ffmpegService'
import { getUniqueFilePath } from '../../lib/fileUtils'
import { formatBytes } from '../../lib/utils'
import { notify } from '../../lib/notify'
import { stat } from '@tauri-apps/plugin-fs'

// Store unlisten function to prevent listener accumulation
let queueUpdateUnlisten: UnlistenFn | null = null
let trailingTimeout: NodeJS.Timeout | null = null

export const createVideoSlice: StateCreator<AppState, [], [], VideoSlice> = (set, get) => {

    return {
        tasks: [],
        tasksById: {},

        // --- OPTIMIZED QUEUE COMMANDS (Rust) ---

        getTaskById: (id: string) => get().tasksById[id],

        initializeQueue: async () => {
            // Helper to normalize tasks array to Record
            const normalizeTasks = (tasks: DownloadTask[]): Record<string, DownloadTask> => {
                const byId: Record<string, DownloadTask> = {}
                for (const task of tasks) {
                    byId[task.id] = task
                }
                return byId
            }

            // 1. Fetch initial state
            try {
                const currentQueue = await invoke<DownloadTask[]>('get_queue_state');
                set({
                    tasks: currentQueue,
                    tasksById: normalizeTasks(currentQueue)
                });
            } catch (e) {
                console.error("Failed to fetch queue state:", e);
            }

            // 2. Cleanup previous listener to prevent memory leak
            if (queueUpdateUnlisten) {
                queueUpdateUnlisten()
                queueUpdateUnlisten = null
            }
            if (trailingTimeout) {
                clearTimeout(trailingTimeout)
                trailingTimeout = null
            }

            // 3. Listen for updates (Throttled to ~5fps with trailing edge)
            let lastUpdate = 0
            const THROTTLE_MS = 200

            queueUpdateUnlisten = await listen<DownloadTask[]>('queue_update', (event) => {
                const now = Date.now()

                // Clear any pending trailing update as we have fresh data
                if (trailingTimeout) {
                    clearTimeout(trailingTimeout)
                    trailingTimeout = null
                }

                if (now - lastUpdate > THROTTLE_MS) {
                    // Leading edge: Update immediately if outside window
                    console.log("[VideoSlice] queue_update RECEIVED:", event.payload?.length || 0, "tasks")
                    set({
                        tasks: event.payload,
                        tasksById: normalizeTasks(event.payload)
                    })
                    lastUpdate = now
                } else {
                    // Trailing edge: Schedule update for end of window
                    const remaining = THROTTLE_MS - (now - lastUpdate)
                    trailingTimeout = setTimeout(() => {
                        console.log("[VideoSlice] queue_update TRAILING:", event.payload?.length || 0, "tasks")
                        set({
                            tasks: event.payload,
                            tasksById: normalizeTasks(event.payload)
                        })
                        lastUpdate = Date.now()
                        trailingTimeout = null
                    }, remaining)
                }
            });
        },


        addTask: async (url, options) => {
            console.log("[VideoSlice] addTask called:", { url, options });
            // No duplicate check needed here, backend handles logic or we allow it.
            try {
                // Pass options directly. Backend expects camelCase keys matching YtDlpOptions
                await invoke('add_to_queue', { url, options });
                console.log("[VideoSlice] addTask success (invoke returned)");
                // No need to manually update state, the event 'queue_update' will fire from backend
            } catch (e) {
                console.error("[VideoSlice] addTask failed:", e);
                notify.error("Failed to add to queue", { description: String(e) });
            }
        },

        removeTask: async (id: string) => {
            try {
                await invoke('remove_from_queue', { id });
            } catch (e) {
                console.error("Failed to remove task:", e);
            }
        },

        pauseTask: async (id) => {
            try {
                await invoke('pause_task', { id });
            } catch (e) {
                console.error("Failed to pause task:", e);
                notify.error("Pause Failed", { description: String(e) });
            }
        },

        resumeTask: async (id) => {
            try {
                await invoke('resume_task', { id });
            } catch (e) {
                console.error("Failed to resume task:", e);
                // Fallback: if resume fails (e.g. process gone), maybe we should try restart?
                // For now, just notify.
                notify.error("Resume Failed", { description: String(e) });
            }
        },

        stopTask: async (id) => {
            await invoke('remove_from_queue', { id });
        },

        retryTask: async (id) => {
            // Same as resume for now
            const task = get().tasks.find(t => t.id === id);
            if (task) {
                await invoke('remove_from_queue', { id }); // Ensure cleaned up
                // Small delay?
                // Then re-add
                const opts = task.options || task._options || {};
                await invoke('add_to_queue', { url: task.url, options: opts });
            }
        },

        clearTask: async (id) => {
            await invoke('remove_from_queue', { id });
        },

        // --- LEGACY / FRONTEND ONLY FEATURES ---

        deleteHistory: () => {
            // This modifies local state filters. 
            // Since state comes from Backend, we should probably have a backend command `clear_history`?
            // Or we just locally filter and maybe backend doesn't broadcast 'history' tasks?
            // Current backend: `get_queue_state` returns ALL tasks including completed.
            // If we really want to delete history, we should tell backend to remove completed tasks.

            const completed = get().tasks.filter(t => t.status === 'completed' || t.status === 'stopped');
            completed.forEach(t => {
                invoke('remove_from_queue', { id: t.id });
            });
        },

        importTasks: (importedTasks) => {
            // Batch add
            importedTasks.forEach(t => {
                invoke('add_to_queue', { url: t.url, options: t.options || t._options || {} });
            });
        },

        updateTask: (_id, _updates) => {
            // State managed by backend
        },

        startTask: async (_id) => {
            // Backend handled
        },

        processQueue: () => {
            // Backend handled
        },

        recoverDownloads: () => {
            const interrupted = get().tasks.filter(t =>
                t.status === 'stopped' && (t.statusDetail === 'Interrupted by Restart' || t.statusDetail?.includes('Interrupted'))
            );
            interrupted.forEach(t => {
                invoke('add_to_queue', {
                    url: t.url,
                    options: t.options || t._options || {}
                });
            });
            return interrupted.length;
        },

        getInterruptedCount: () => {
            return get().tasks.filter(t =>
                t.status === 'stopped' && (t.statusDetail === 'Interrupted by Restart' || t.statusDetail?.includes('Interrupted'))
            ).length;
        },
        sanitizeTasks: () => { },
        cleanupOldTasks: (_days) => {
            // Implemented via backend retention later
        },

        // --- COMPRESSION (Rust-backed) ---
        compressTask: async (taskId, options) => {
            const { tasks, updateTask } = get()
            const originalTask = tasks.find(t => t.id === taskId)
            if (!originalTask || !originalTask.filePath) return

            let outputPath = buildCompressedOutputPath(originalTask.filePath)
            try {
                outputPath = await getUniqueFilePath(outputPath)
            } catch { /* ignore */ }

            // Create a pseudo-task for UI tracking if it doesn't exist
            // Or update the current one's status
            updateTask(taskId, {
                status: 'processing',
                statusDetail: 'Initializing Compression...',
                progress: 0
            })

            try {
                const { compressMedia } = await import('../../lib/ffmpegService')
                await compressMedia(
                    originalTask.filePath,
                    outputPath,
                    options,
                    (event) => {
                        updateTask(taskId, {
                            progress: event.percent,
                            speed: event.speed,
                            eta: event.eta,
                            statusDetail: `Compressing... ${event.percent}%`
                        })
                    }
                )

                let sizeBytes = 0
                try {
                    const s = await stat(outputPath)
                    sizeBytes = s.size
                } catch { /* ignore */ }

                // Add to history properly via backend
                await invoke('add_history_item', {
                    title: `Exported: ${originalTask.title}`,
                    url: originalTask.url,
                    filePath: outputPath,
                    fileSize: formatBytes(sizeBytes)
                });

                // Refresh queue to restore original task state (remove "Compressing..." status)
                await get().initializeQueue();

                notify.success("Compression Complete", { description: `${outputPath} (${formatBytes(sizeBytes)})` })

            } catch (e) {
                console.error("Compression Failed:", e)
                updateTask(taskId, {
                    status: 'error',
                    statusDetail: String(e)
                })
                notify.error("Compression Failed", { description: String(e) })
            }
        }
    }
}
