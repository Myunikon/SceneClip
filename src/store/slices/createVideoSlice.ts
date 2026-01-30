
import { StateCreator } from 'zustand'
import { AppState, DownloadTask, VideoSlice } from './types'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getFFmpegCommand, buildCompressionArgs, buildCompressedOutputPath, detectFileType } from '../../lib/ffmpegService'
import { getUniqueFilePath } from '../../lib/fileUtils'
import { formatBytes } from '../../lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { notify } from '../../lib/notify'
import { stat } from '@tauri-apps/plugin-fs'

// Helper for compression pid tracking
const activeCompressionMap = new Map<string, any>()

export const createVideoSlice: StateCreator<AppState, [], [], VideoSlice> = (set, get) => {

    return {
        tasks: [],

        // --- QUEUE COMMANDS (Rust) ---

        initializeQueue: async () => {
            // 1. Fetch initial state
            try {
                const currentQueue = await invoke<DownloadTask[]>('get_queue_state');
                set({ tasks: currentQueue });
            } catch (e) {
                console.error("Failed to fetch queue state:", e);
            }

            // 2. Listen for updates
            await listen<DownloadTask[]>('queue_update', (event) => {
                set({ tasks: event.payload });
            });
        },

        addTask: async (url, options) => {
            // No duplicate check needed here, backend handles logic or we allow it.
            try {
                // Pass options directly. Backend expects camelCase keys matching YtDlpOptions
                await invoke('add_to_queue', { url, options });
                // No need to manually update state, the event 'queue_update' will fire from backend
            } catch (e) {
                console.error("Failed to add task:", e);
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

        recoverDownloads: () => 0, // Backend handles this on startup
        retryAllFailed: () => {
            const failed = get().tasks.filter(t => t.status === 'error');
            failed.forEach(t => {
                invoke('add_to_queue', { url: t.url, options: t.options || t._options || {} });
            });
        },
        getInterruptedCount: () => 0,
        sanitizeTasks: () => { },
        cleanupOldTasks: (_days) => {
            // Implemented via backend retention later
        },

        // --- COMPRESSION (Frontend managed) ---
        // TODO: Move compression to Rust eventually
        compressTask: async (taskId, options) => {
            const { tasks, settings } = get()
            const originalTask = tasks.find(t => t.id === taskId)
            if (!originalTask || !originalTask.filePath) return

            const fileType = detectFileType(originalTask.filePath)
            let outputPath = buildCompressedOutputPath(originalTask.filePath)

            try {
                outputPath = await getUniqueFilePath(outputPath)
            } catch { /* ignore */ }

            const args = buildCompressionArgs(originalTask.filePath, outputPath, options, fileType)
            const newId = uuidv4()

            // Temporary Notification
            notify.info("Compression Started", { description: "Running in background..." });

            try {
                const cmd = await getFFmpegCommand(args, settings.binaryPathFfmpeg)
                const child = await cmd.spawn()
                activeCompressionMap.set(newId, child)

                cmd.on('close', async (data) => {
                    activeCompressionMap.delete(newId)
                    if (data.code === 0) {
                        let sizeBytes = 0
                        try {
                            const s = await stat(outputPath)
                            sizeBytes = s.size
                        } catch { /* ignore */ }
                        notify.success("Compression Complete", { description: `${outputPath} (${formatBytes(sizeBytes)})` })
                    } else {
                        notify.error("Compression Failed", { description: `Exit code ${data.code}` })
                    }
                })
            } catch (e) {
                notify.error("Compression Start Failed", { description: String(e) })
            }
        }
    }
}
