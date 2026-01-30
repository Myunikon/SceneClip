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

    // yt-dlp Version Tracking
    ytdlpVersion: null,
    ytdlpLatestVersion: null,
    ytdlpNeedsUpdate: false,

    // FFmpeg Version Tracking
    ffmpegVersion: null,
    ffmpegLatestVersion: null,
    ffmpegNeedsUpdate: false,

    // Loading state
    isCheckingUpdates: false,

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
            const [ffVer, ytVer] = await Promise.all([
                getBinaryVersion('ffmpeg'),
                getBinaryVersion('yt-dlp')
            ])

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

            // Optional Binaries (aria2c, rsgain) - Log only, no notification
            const [aria2Ver, rsgainVer] = await Promise.all([
                getBinaryVersion('aria2c'),
                getBinaryVersion('rsgain')
            ])

            console.log(`  [DL] aria2c   : ${aria2Ver || '[WARN] Not bundled (download acceleration disabled)'}`)
            console.log(`  [RG] rsgain   : ${rsgainVer || '[WARN] Not bundled (ReplayGain disabled)'}`)
            console.log('==================================================')

            // Log to app logs (terminal panel)
            if (aria2Ver) {
                get().addLog({ message: `aria2c detected: v${aria2Ver} (Download acceleration enabled)`, type: 'info', source: 'system' })
            } else {
                get().addLog({ message: `aria2c not found. Multi-threaded downloads disabled.`, type: 'warning', source: 'system' })
            }

            if (rsgainVer) {
                get().addLog({ message: `rsgain detected: v${rsgainVer} (ReplayGain enabled)`, type: 'info', source: 'system' })
            } else {
                get().addLog({ message: `rsgain not found. ReplayGain normalization disabled.`, type: 'warning', source: 'system' })
            }

        } catch (e) {
            console.error("Binary check failed:", e)
            const t = translations[get().settings.language as keyof typeof translations]?.errors || translations.en.errors
            notify.error(t.binary_validation, { description: String(e) })
            get().addLog({ message: `Binary check failed: ${e}`, type: 'error', source: 'system' })
        }
    },

    checkBinaryUpdates: async () => {
        set({ isCheckingUpdates: true })
        try {
            const { checkForUpdates } = await import('../../lib/updater-service')
            const result = await checkForUpdates()

            set({
                ytdlpNeedsUpdate: result.ytdlp.has_update,
                ytdlpVersion: result.ytdlp.current,
                ytdlpLatestVersion: result.ytdlp.latest,
                ffmpegNeedsUpdate: result.ffmpeg.has_update,
                ffmpegVersion: result.ffmpeg.current,

                isCheckingUpdates: false
            })

            get().addLog({ message: `[Version Check] yt-dlp: ${result.ytdlp.current} → ${result.ytdlp.latest || 'N/A'} (Update: ${result.ytdlp.has_update})`, type: 'info', source: 'system' })
            get().addLog({ message: `[Version Check] FFmpeg: ${result.ffmpeg.current} → ${result.ffmpeg.latest || 'N/A'} (Update: ${result.ffmpeg.has_update})`, type: 'info', source: 'system' })
        } catch (e) {
            console.error('Version check failed:', e)
            const t = translations[get().settings.language as keyof typeof translations]?.errors || translations.en.errors
            notify.error(t.update_check, { description: String(e) })
            get().addLog({ message: `[Version Check] Failed: ${e}`, type: 'error', source: 'system' })
        } finally {
            set({ isCheckingUpdates: false })
        }
    },

    updateBinary: async (name) => {
        try {
            get().addLog({ message: `Starting update for ${name}...`, type: 'info', source: 'system' })
            const { updateBinary } = await import('../../lib/updater-service')
            const newPath = await updateBinary(name)

            // Save path to settings
            if (name === 'yt-dlp') {
                get().setSetting('binaryPathYtDlp', newPath)
                // Optimistic update
                set({ ytdlpNeedsUpdate: false })
            } else {
                get().setSetting('binaryPathFfmpeg', newPath)
                set({ ffmpegNeedsUpdate: false })
            }

            notify.success(`${name} updated successfully!`)
            get().addLog({ message: `${name} updated to ${newPath}`, type: 'success', source: 'system' })

            // Re-check to confirm version
            get().checkBinaryUpdates()

        } catch (e) {
            console.error("Update failed:", e)
            notify.error(`Update failed: ${e}`)
            get().addLog({ message: `Update failed: ${e}`, type: 'error', source: 'system' })
        }
    },
})
