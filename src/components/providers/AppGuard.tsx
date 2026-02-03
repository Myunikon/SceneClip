import { useEffect, useState, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAppStore } from '../../store'
import { NativeLoader } from './NativeLoader'
import { useRecovery } from '../../hooks/useRecovery'
import { useTheme } from '../../hooks/useTheme'
import i18n from '../../lib/i18n'
import { useShallow } from 'zustand/react/shallow'

export function AppGuard({ children }: { children: React.ReactNode }) {
    const { initListeners, binariesReady, settings } = useAppStore(
        useShallow(state => ({
            initListeners: state.initListeners,
            binariesReady: state.binariesReady,
            settings: state.settings
        }))
    )

    // 1. Enforce Theme immediately
    useTheme({ theme: settings.theme, frontendFontSize: settings.frontendFontSize })

    useRecovery()

    const [loading, setLoading] = useState(true)
    const [initError, setInitError] = useState<string | null>(null)
    const [isRefresh, setIsRefresh] = useState(false)

    // Prevent double initialization race condition
    const initStartedRef = useRef(false)

    useEffect(() => {
        // Move sessionStorage access to effect to avoid hydration mismatch/render blocking
        try {
            if (typeof sessionStorage !== 'undefined') {
                setIsRefresh(!!sessionStorage.getItem('app_initialized'))
            }
        } catch { /* Ignore storage errors */ }

        const init = async () => {
            if (initStartedRef.current) return
            initStartedRef.current = true

            setLoading(true)

            // Skip fast loading simulation if already initialized in this session
            let hasInitialized = false
            try {
                hasInitialized = typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('app_initialized')
            } catch { /* Ignore */ }

            const minTime = hasInitialized ? 0 : 1000

            const minLoad = new Promise(resolve => setTimeout(resolve, minTime))

            try {
                // Sync Language (awaiting it to prevent racing)
                const storedLang = settings.language
                if (storedLang && i18n.language !== storedLang) {
                    await i18n.changeLanguage(storedLang)
                }

                await Promise.all([initListeners(), minLoad])

                try {
                    if (typeof sessionStorage !== 'undefined') {
                        sessionStorage.setItem('app_initialized', 'true')
                    }
                } catch { /* Ignore */ }
                setLoading(false)
            } catch (e: unknown) {
                console.error("AppGuard Init Error:", e)
                // Sanitize error message to hide potential local paths
                const rawMessage = e instanceof Error ? e.message : "Failed to initialize application"
                const sanitizedMessage = rawMessage.replace(/[a-zA-Z]:\\[^ ]+/g, '[PATH]').replace(/\/Users\/[^/]+/g, '[HOME]')
                setInitError(sanitizedMessage)
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
                    type="button"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (loading) {
        // 2. On refresh (already initialized), show blank screen
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
