import { StateCreator } from 'zustand'
import { AppState, SystemSlice } from './types'
import { downloadDir } from '@tauri-apps/api/path'
import { notify } from '../../lib/notify'
import { isTauriAvailable } from '../../lib/platform'
import { runBinaryValidation } from '../../lib/binary-validator'
import { getBinaryVersion } from '../../lib/updater-service'
import { translations } from '../../lib/locales'


export const createSystemSlice: StateCreator<AppState, [], [], SystemSlice> = (set, get) => ({
    binariesReady: false,
    listenersInitialized: false,
    hasNotifiedMissingBinaries: false,
    gpuType: 'cpu' as 'nvidia' | 'amd' | 'intel' | 'apple' | 'cpu',

    // App Version Tracking
    appVersion: null,
    appLatestVersion: null,
    appNeedsUpdate: false,
    appUpdateError: undefined,

    // yt-dlp Version Tracking
    ytdlpVersion: null,
    ytdlpLatestVersion: null,
    ytdlpNeedsUpdate: false,
    ytdlpIntegrityValid: true,

    // FFmpeg Version Tracking
    ffmpegVersion: null,
    ffmpegLatestVersion: null,
    ffmpegNeedsUpdate: false,
    ffmpegIntegrityValid: true,


    ytdlpUpdateProgress: null,
    ffmpegUpdateProgress: null,
    appUpdateProgress: null,

    // Loading state
    isCheckingUpdates: false,
    isCheckingAppUpdate: false,
    isCheckingYtdlpUpdate: false,

    // Keyring
    savedCredentials: [],

    setBinariesReady: (ready) => set({ binariesReady: ready }),

    detectHardwareAccel: async () => {
        try {
            // With sidecar, we assume it works or user verifies manually.
            // Simple check if ffmpeg is versionable
            const version = await getBinaryVersion('ffmpeg')

            if (version) {
                try {
                    const { invoke } = await import('@tauri-apps/api/core')

                    // 1. CPU & GPU DIAGNOSTIC
                    // Backend now returns GpuInfo struct with CPU info in debug_info
                    interface GpuInfo { vendor: string, model: string, renderer: string, debug_info: string }
                    const gpuInfo = await invoke<GpuInfo>('check_gpu_support')

                    let logMsg = `GPU Detection: ${gpuInfo.vendor !== 'none' && gpuInfo.vendor !== 'cpu' ? gpuInfo.model : 'CPU Only'}`
                    if (gpuInfo.renderer.includes('Software')) {
                        logMsg += ' (FFmpeg Hardware Encoder Unavailable)'
                    } else {
                        logMsg += ` [Renderer: ${gpuInfo.renderer}]`
                    }
                    get().addLog({ message: logMsg, type: 'info', source: 'system' })
                    get().addLog({ message: `[GPU DETECT DIAGNOSTIC]\n${gpuInfo.debug_info}`, type: 'info', source: 'system' })


                    // Validate against known types (including Apple Silicon/VideoToolbox)
                    const validTypes = ['nvidia', 'amd', 'intel', 'apple', 'cpu']
                    // Use OS vendor if valid, even if renderer is software (to show the name)
                    const finalType = validTypes.includes(gpuInfo.vendor) ? gpuInfo.vendor : 'cpu'

                    set({
                        gpuType: finalType as 'nvidia' | 'amd' | 'intel' | 'apple' | 'cpu',
                        gpuModel: gpuInfo.model,
                        gpuRenderer: gpuInfo.renderer
                    })
                } catch (e) {
                    console.error("GPU details fetch failed:", e)
                    get().addLog({ message: `[GPU Error] Backend check failed: ${e}`, type: 'error', source: 'system' })
                    set({ gpuType: 'cpu' })
                }
            }
        } catch (e) {
            console.error("GPU Check failed:", e)
        }
    },

    validateBinaries: async () => {
        // Delegated to service
        const lang = get().settings.language || 'en'
        await runBinaryValidation((entry) => get().addLog(entry), lang)
    },

    initListeners: async () => {
        // Guard to prevent multiple calls
        if (get().listenersInitialized) {
            return
        }

        // Setup Queue Listeners (Rust Backend)
        get().initializeQueue()

        set({ listenersInitialized: true })

        // Check if running in Tauri context
        if (!isTauriAvailable()) {
            console.warn("Tauri not available, running in browser-only mode")
            return
        }


        const { settings, setSetting, tasks, updateTask } = get()

        // CRASH RECOVERY
        tasks.forEach(t => {
            if (t.status === 'downloading') {
                updateTask(t.id, { status: 'paused', speed: '-', eta: 'Interrupted' })
            }
        })

        if (!settings.downloadPath) {
            const defaultPath = await downloadDir()
            setSetting('downloadPath', defaultPath)
        }

        // Check for Binaries (Sidecar Check)
        try {
            get().addLog({ message: 'Checking bundled binaries...', type: 'info', source: 'system' })

            // Essential Binaries (yt-dlp, ffmpeg)
            const [ffVer, ytVer, debugPaths] = await Promise.all([
                getBinaryVersion('ffmpeg'),
                getBinaryVersion('yt-dlp'),
                (async () => {
                    try {
                        const { invoke } = await import('@tauri-apps/api/core')
                        return await invoke<string[]>('debug_binary_paths')
                    } catch { return [] }
                })()
            ])

            console.log('Binary Path Debug Info:', debugPaths)

            // Log essential binaries
            console.log('==================================================')
            console.log('SceneClip Binary Detection Report')
            console.log('==================================================')
            console.log(`  [OK] yt-dlp   : ${ytVer || '[ERROR] NOT FOUND'}`)
            console.log(`  [OK] ffmpeg   : ${ffVer || '[ERROR] NOT FOUND'}`)

            if (ffVer && ytVer) {
                get().addLog({ message: `Essential Binaries: ffmpeg=${ffVer}, yt-dlp=${ytVer}`, type: 'success', source: 'system' })
                set({ binariesReady: true, ytdlpVersion: ytVer })
                get().detectHardwareAccel()
            } else {
                // If sidecar check fails, it means they are missing or permission denied
                get().addLog({ message: `Missing essential binaries! ffmpeg=${ffVer}, yt-dlp=${ytVer}`, type: 'error', source: 'system' })
                notify.error("Critical Error: Bundled binaries missing or not executable.")
                set({ binariesReady: false })
            }

            // Optional Binaries - (Not needed for core functionality)
            console.log('==================================================')

        } catch (e) {
            console.error("Binary check failed:", e)
            const t = translations[get().settings.language as keyof typeof translations]?.errors || translations.en.errors
            notify.error(t.binary_validation, { description: String(e) })
            get().addLog({ message: `Binary check failed: ${e}`, type: 'error', source: 'system' })
        }
    },

    checkBinaryUpdates: async (scope = 'all') => {
        if (scope === 'app') set({ isCheckingAppUpdate: true })
        else if (scope === 'binaries') set({ isCheckingYtdlpUpdate: true })
        else set({ isCheckingUpdates: true })

        try {
            const { checkForUpdates } = await import('../../lib/updater-service')
            const result = await checkForUpdates(scope)

            const updates: Partial<SystemSlice> = {}

            if (scope === 'app' || scope === 'all') {
                updates.appVersion = result.app_update.current
                updates.appLatestVersion = result.app_update.latest
                updates.appNeedsUpdate = result.app_update.has_update
                updates.appUpdateError = result.app_update.error
            }

            if (scope === 'binaries' || scope === 'all') {
                updates.ytdlpVersion = result.ytdlp.current
                updates.ytdlpLatestVersion = result.ytdlp.latest
                updates.ytdlpIntegrityValid = result.ytdlp.integrity_valid
                updates.ytdlpUpdateError = result.ytdlp.error
            }

            set({ ...updates })

            // Log warnings for specific failures
            if (result.app_update.error) get().addLog({ message: `[Update Check] SceneClip Error: ${result.app_update.error}`, type: 'warning', source: 'system' })
            else if (result.app_update.has_update) get().addLog({ message: `[Update Check] 🎉 SceneClip Update Available: ${result.app_update.latest}`, type: 'success', source: 'system' })

            if (result.ytdlp.error) get().addLog({ message: `[Version Check] yt-dlp Error: ${result.ytdlp.error}`, type: 'warning', source: 'system' })
            else get().addLog({ message: `[Version Check] yt-dlp: ${result.ytdlp.current} → ${result.ytdlp.latest || 'N/A'} (Update: ${result.ytdlp.has_update})`, type: 'info', source: 'system' })

        } catch (e) {
            console.error('Version check failed:', e)
            const t = translations[get().settings.language as keyof typeof translations]?.errors || translations.en.errors
            notify.error(t.update_check, { description: String(e) })
            get().addLog({ message: `[Version Check] Failed: ${e}`, type: 'error', source: 'system' })
        } finally {
            set({
                isCheckingUpdates: false,
                isCheckingAppUpdate: false,
                isCheckingYtdlpUpdate: false
            })
        }
    },



    installAppUpdate: async () => {
        try {
            get().addLog({ message: `Starting SceneClip update...`, type: 'info', source: 'system' })
            const { invoke } = await import('@tauri-apps/api/core')
            const { listen } = await import('@tauri-apps/api/event')

            interface ProgressEvent {
                binary: string
                percent: number
                downloaded: number
                total: number
            }

            const unlisten = await listen<ProgressEvent>('update-progress', (event) => {
                if (event.payload.binary === 'SceneClip') {
                    set({ appUpdateProgress: event.payload.percent })
                }
            })

            await invoke('install_app_update')

            unlisten()
        } catch (e) {
            console.error("App update failed:", e)
            notify.error(`App update failed: ${e}`)
            get().addLog({ message: `App update failed: ${e}`, type: 'error', source: 'system' })
            set({ appUpdateProgress: null })
        }
    },

    updateBinary: async (name) => {
        if (name !== 'yt-dlp') {
            notify.error("Updates are disabled for this component.")
            return
        }

        try {
            get().addLog({ message: `Starting update for ${name}...`, type: 'info', source: 'system' })
            const { updateBinary } = await import('../../lib/updater-service')

            // Callback to update progress state
            const onProgress = (percent: number) => {
                const s = {} as any
                if (name === 'yt-dlp') s.ytdlpUpdateProgress = percent
                set(s)
            }

            const newPath = await updateBinary(name, onProgress)

            // Save path to settings
            if (name === 'yt-dlp') {
                get().setSetting('binaryPathYtDlp', newPath)
                set({ ytdlpNeedsUpdate: false, ytdlpUpdateProgress: null })
            }

            notify.success(`${name} updated successfully!`)
            get().addLog({ message: `${name} updated to ${newPath}`, type: 'success', source: 'system' })

            // Re-check to confirm version
            get().checkBinaryUpdates('binaries')

        } catch (e) {
            console.error("Update failed:", e)
            notify.error(`Update failed: ${e}`)
            get().addLog({ message: `Update failed: ${e}`, type: 'error', source: 'system' })

            // Reset progress on error
            if (name === 'yt-dlp') set({ ytdlpUpdateProgress: null })
        }
    },
    cancelUpdate: async (name: string) => {
        try {
            const { invoke } = await import('@tauri-apps/api/core')
            await invoke('cancel_update', { binary: name })
            get().addLog({ message: `Updates cancelled for ${name}`, type: 'warning', source: 'system' })

            // Reset progress
            if (name === 'yt-dlp') set({ ytdlpUpdateProgress: null })

        } catch (e) {
            console.error("Failed to cancel update:", e)
        }
    }
})
