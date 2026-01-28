import { useEffect, useState, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAppStore } from '../../store'
import { NativeLoader } from './NativeLoader'
import { useRecovery } from '../../hooks/useRecovery'
import { useTheme } from '../../hooks/useTheme' // Added import for useTheme
import i18n from '../../lib/i18n'

export function AppGuard({ children }: { children: React.ReactNode }) {
    const {
        initListeners,
        binariesReady,
        settings // Added settings to destructuring
    } = useAppStore()

    // 1. Enforce Theme immediately
    useTheme({ theme: settings.theme, frontendFontSize: settings.frontendFontSize })

    // Parabolic feature: Check for interrupted downloads on startup
    useRecovery()

    const [loading, setLoading] = useState(true)
    const [initError, setInitError] = useState<string | null>(null)

    // Prevent double initialization race condition
    const initStartedRef = useRef(false)

    useEffect(() => {
        const init = async () => {
            if (initStartedRef.current) return
            initStartedRef.current = true

            setLoading(true)

            // Skip fast loading simulation if already initialized in this session
            const hasInitialized = sessionStorage.getItem('app_initialized')
            const minTime = hasInitialized ? 0 : 1000

            const minLoad = new Promise(resolve => setTimeout(resolve, minTime))

            try {
                // Sync Language from Store to i18n
                const storedLang = settings.language // Changed to use settings from hook
                if (storedLang && i18n.language !== storedLang) {
                    i18n.changeLanguage(storedLang)
                }

                await Promise.all([initListeners(), minLoad])

                sessionStorage.setItem('app_initialized', 'true')
                setLoading(false)
            } catch (e: unknown) {
                console.error("AppGuard Init Error:", e)
                setInitError(e instanceof Error ? e.message : "Failed to initialize application")
                setLoading(false)
            }
        }

        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (initError || (!loading && !binariesReady)) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-6 animate-in fade-in">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
                <div className="text-center space-y-2 max-w-md px-6">
                    <h2 className="text-xl font-bold">Initialization Failed</h2>
                    <p className="text-muted-foreground text-sm">
                        {initError || "Core binaries (yt-dlp/ffmpeg) are missing or not executable."}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                        Please verify that the binaries are correctly placed in the application folder.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (loading) {
        // 2. On refresh (already initialized), show blank screen (respecting theme bg) instead of loader
        // This avoids the "spinner flash" user complained about.
        // sessionStorage check sync for render logic
        const isRefresh = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('app_initialized')

        if (isRefresh) {
            return null // Invisible loading for refresh
        }

        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-4">
                <NativeLoader text="Initializing..." size="lg" />
            </div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}
