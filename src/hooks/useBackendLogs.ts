import { useEffect, useRef } from 'react'
import { attachConsole } from '@tauri-apps/plugin-log'
import { useAppStore } from '../store'
import { useShallow } from 'zustand/react/shallow'

/**
 * Hook to bridge backend Rust logs to frontend log store.
 * Calls `attachConsole()` from @tauri-apps/plugin-log to intercept
 * logs emitted via `log::info!`, `log::error!`, etc. from the Rust backend.
 * 
 * These logs are automatically printed to browser console when
 * `TargetKind::Webview` is enabled in the backend plugin configuration.
 * 
 * This hook captures those logs and routes them to the Zustand store
 * so they appear in the Terminal/Logs UI.
 */
export function useBackendLogs() {
    const { addLog, settings } = useAppStore(
        useShallow((s) => ({
            addLog: s.addLog,
            settings: s.settings
        }))
    )

    const detachRef = useRef<(() => void) | null>(null)
    const originalConsole = useRef<{
        log: typeof console.log
        warn: typeof console.warn
        error: typeof console.error
        debug: typeof console.debug
        trace: typeof console.trace
        info: typeof console.info
    } | null>(null)

    useEffect(() => {
        // Only bridge logs if developer mode is enabled
        // This prevents unnecessary processing in production
        if (!settings.developerMode) {
            return
        }

        // Store original console methods
        originalConsole.current = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            debug: console.debug,
            trace: console.trace,
            info: console.info
        }

        // Dedup cache to prevent double-logging
        // (Tauri log plugin emits to console, which our interceptor catches again)
        const recentMessages = new Map<string, number>()
        const DEDUP_WINDOW_MS = 500

        // Intercept console methods to capture backend logs
        const interceptConsole = () => {
            const createInterceptor = (
                level: 'info' | 'warning' | 'error' | 'debug' | 'trace',
                originalFn: (...args: unknown[]) => void
            ) => {
                return (...args: unknown[]) => {
                    // Call original console method first
                    originalFn.apply(console, args)

                    // Check if any argument is an Error to extract stack trace
                    let stackTrace: string | undefined
                    const formattedArgs = args.map((arg) => {
                        if (arg instanceof Error) {
                            if (!stackTrace) stackTrace = arg.stack
                            return `${arg.name}: ${arg.message}`
                        }
                        return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    })

                    const message = formattedArgs.join(' ')

                    // Skip empty messages or internal React/framework noise
                    if (!message || message.startsWith('[HMR]') || message.startsWith('[vite]')) {
                        return
                    }

                    // Dedup: skip if same message was logged within window
                    const now = Date.now()
                    const lastSeen = recentMessages.get(message)
                    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
                        return // Skip duplicate
                    }
                    recentMessages.set(message, now)

                    // Cleanup old entries periodically
                    if (recentMessages.size > 100) {
                        for (const [msg, time] of recentMessages) {
                            if (now - time > DEDUP_WINDOW_MS * 2) {
                                recentMessages.delete(msg)
                            }
                        }
                    }

                    // Determine source based on message content
                    let source: 'system' | 'ytdlp' | 'ffmpeg' | 'ui' = 'system'
                    if (message.toLowerCase().includes('yt-dlp') || message.toLowerCase().includes('ytdlp')) {
                        source = 'ytdlp'
                    } else if (message.toLowerCase().includes('ffmpeg') || message.toLowerCase().includes('ffprobe')) {
                        source = 'ffmpeg'
                    }

                    // Add to store
                    addLog({
                        message,
                        level,
                        source,
                        stackTrace
                    })
                }
            }

            console.log = createInterceptor('info', originalConsole.current!.log)
            console.info = createInterceptor('info', originalConsole.current!.info)
            console.warn = createInterceptor('warning', originalConsole.current!.warn)
            console.error = createInterceptor('error', originalConsole.current!.error)
            console.debug = createInterceptor('debug', originalConsole.current!.debug)
            // Note: console.trace behaves differently (shows stack), map to debug
        }

        // Set up console interception
        interceptConsole()

        // Attach to Tauri's log stream
        attachConsole()
            .then(async (detach) => {
                detachRef.current = detach

                // --- Log System Info on Connect ---
                try {
                    // Dynamic import to avoid issues if plugin not present
                    const { type, version, arch, platform } = await import('@tauri-apps/plugin-os')
                    const osType = await type()
                    const osVersion = await version()
                    const osArch = await arch()
                    const osPlatform = await platform()

                    addLog({
                        message: `System Info: ${osType} ${osPlatform} ${osVersion} (${osArch})`,
                        level: 'info',
                        source: 'system',
                        context: `UserAgent: ${navigator.userAgent}`
                    })
                } catch (e) {
                    console.error("Failed to fetch OS info", e)
                }

                addLog({
                    message: 'Backend log bridge established',
                    level: 'success',
                    source: 'system'
                })
            })
            .catch((err) => {
                console.error('Failed to attach console for backend logs:', err)
            })

        return () => {
            // Restore original console methods
            if (originalConsole.current) {
                console.log = originalConsole.current.log
                console.warn = originalConsole.current.warn
                console.error = originalConsole.current.error
                console.debug = originalConsole.current.debug
                console.info = originalConsole.current.info
            }

            // Detach from log stream
            if (detachRef.current) {
                detachRef.current()
                detachRef.current = null
            }
        }
    }, [settings.developerMode, addLog])
}
