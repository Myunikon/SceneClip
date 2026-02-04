/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router'
// import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useRef, useEffect, useState, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { exists } from '@tauri-apps/plugin-fs'
import { downloadDir } from '@tauri-apps/api/path'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import { useTranslation } from 'react-i18next'
import { notify } from '../lib/notify'
import { useAppStore } from '../store'
import { useTheme } from '../hooks/useTheme'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useDeepLinks } from '../hooks/useDeepLinks'
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts'
import { useBackendLogs } from '../hooks/useBackendLogs'
import { AddDialog, AddDialogHandle } from '../components/dialogs'
import { Onboarding } from '../components/providers'
import { ClipboardListener } from '../components/providers'
import { GuideModal } from '../components/dialogs'
import { ShortcutsPopover } from '../components/common'
import { AppHeader } from '../components/layout'
import { AppLayout } from '../components/layout'
import { ContextMenu } from '../components/common'
import { TooltipProvider } from '../components/ui/tooltip'
import { StatusFooter } from '../components/statusbar'


export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    const { settings } = useAppStore()
    const { i18n } = useTranslation()
    const router = useRouter()
    // const location = useLocation() // Not needed here anymore if we don't pass activeTab to header

    // Sync Language with Store
    useEffect(() => {
        if (settings.language && i18n.language !== settings.language) {
            i18n.changeLanguage(settings.language)
        }
    }, [settings.language, i18n])

    const [clipboardUrl, setClipboardUrl] = useState('')
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [showGuide, setShowGuide] = useState(false)

    // Dialog Refs
    const addDialogRef = useRef<AddDialogHandle>(null)

    // Custom Hooks Integration
    useTheme({ theme: settings.theme, frontendFontSize: settings.frontendFontSize })
    useBackendLogs() // Bridge backend logs to frontend when developerMode is enabled

    const isOffline = useNetworkStatus()

    /* -------------------------------------------------------------------------- */
    /* QUICK DOWNLOAD HANDLER                                                     */
    /* -------------------------------------------------------------------------- */
    const [clipboardCookies, setClipboardCookies] = useState<string | undefined>(undefined)
    const [clipboardUA, setClipboardUA] = useState<string | undefined>(undefined)
    const [clipboardStart, setClipboardStart] = useState<number | undefined>(undefined)
    const [clipboardEnd, setClipboardEnd] = useState<number | undefined>(undefined)

    const handleNewTask = useCallback(async (url?: string, cookies?: string, userAgent?: string, start?: number, end?: number) => {
        if (url) {
            setClipboardUrl(url)
            setClipboardCookies(cookies)
            setClipboardUA(userAgent)
            setClipboardStart(start)
            setClipboardEnd(end)
        } else {
            setClipboardUrl('')
            setClipboardCookies(undefined)
            setClipboardUA(undefined)
            setClipboardStart(undefined)
            setClipboardEnd(undefined)
        }
        // Small delay to ensure state is set before dialog opens
        setTimeout(() => addDialogRef.current?.showModal(), 50)
    }, [])

    const addTask = (url: string, opts: any) => useAppStore.getState().addTask(url, opts)
    const openDialog = () => handleNewTask()


    /* -------------------------------------------------------------------------- */
    /* GLOBAL EVENT LISTENERS                                                     */
    /* -------------------------------------------------------------------------- */
    // Global Error Handler
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            console.error("Global Error Caught:", event.error)
            notify.error("Unexpected Error", {
                description: event.error?.message || "An unknown error occurred",
                duration: 10000,
                action: { label: "Reload", onClick: () => window.location.reload() }
            })
        }
        const handleRejection = (event: PromiseRejectionEvent) => {
            let message = "Unknown error"
            if (event.reason instanceof Error) message = event.reason.message
            else if (typeof event.reason === 'string') message = event.reason
            else if (event.reason?.message) message = event.reason.message

            notify.error("Unhandled Async Error", { description: message, duration: 10000 })
        }
        window.addEventListener('error', handleError)
        window.addEventListener('unhandledrejection', handleRejection)
        return () => {
            window.removeEventListener('error', handleError)
            window.removeEventListener('unhandledrejection', handleRejection)
        }
    }, [])

    // Window Close Handler
    useEffect(() => {
        let unlisten: () => void;
        const setupListener = async () => {
            unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
                const state = useAppStore.getState()
                const hasScheduled = state.tasks.some(t => t.status === 'scheduled')
                const hasActive = state.tasks.some(t => t.status === 'downloading' || t.status === 'fetching_info')

                if (hasScheduled) {
                    event.preventDefault()
                    await getCurrentWindow().minimize()
                    notify.warning("Scheduler Active \u23F3", {
                        description: "App minimized to background to keep the timer running. Don't close it!",
                        duration: 5000
                    })
                    return
                }

                if (hasActive && state.settings.closeAction === 'minimize') {
                    event.preventDefault()
                    await getCurrentWindow().minimize()
                    notify.info("Downloads Running \u2B07\uFE0F", { description: "App minimized to continue downloading." })
                    return
                }

                if (state.settings.closeAction === 'minimize') {
                    event.preventDefault()
                    await getCurrentWindow().minimize()
                }
            })
        }
        setupListener()
        return () => { if (unlisten) unlisten() }
    }, [])

    // Font Size Application
    useEffect(() => {
        const root = document.documentElement
        const sizeMap: Record<string, string> = { small: '13px', medium: '16px', large: '20px' }
        const targetSize = sizeMap[settings.frontendFontSize || 'medium']
        root.style.fontSize = targetSize
    }, [settings.frontendFontSize])

    // Scheduler Logic: Moved to Backend (download_queue.rs)
    // The backend now handles picking up tasks that hit their scheduled time.

    // Global Shortcuts
    useGlobalShortcuts({
        onNewTask: () => handleNewTask(),
        onSettings: () => router.navigate({ to: '/settings' }),
        onHistory: () => router.navigate({ to: '/history' }),
        onDownloads: () => router.navigate({ to: '/' })
    })

    // Custom Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, hasLink: false, linkUrl: '' })
    useEffect(() => {
        const handleContextMenu = async (e: MouseEvent) => {
            e.preventDefault()
            const target = e.target as HTMLElement
            const link = target.closest('a')
            const linkUrl = link ? link.href : ''
            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, hasLink: !!linkUrl, linkUrl })
        }
        document.addEventListener('contextmenu', handleContextMenu)
        const handleClick = () => setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev)
        window.addEventListener('click', handleClick)
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu)
            window.removeEventListener('click', handleClick)
        }
    }, [])

    // Startup Validation
    useEffect(() => {
        const validatePath = async () => {
            const { settings, setSetting } = useAppStore.getState()
            if (settings.downloadPath) {
                try {
                    const isValid = await exists(settings.downloadPath)
                    if (!isValid) {
                        const defaultPath = await downloadDir()
                        setSetting('downloadPath', defaultPath)
                    }
                } catch (e) {
                    console.error("Failed to validate path:", e)
                }
            }
        }
        validatePath()
        useAppStore.getState().sanitizeTasks()
    }, [])

    // Start Minimized
    useEffect(() => {
        const checkStartMinimized = async () => {
            const { settings } = useAppStore.getState()
            if (settings.startMinimized) {
                try {
                    await getCurrentWindow().hide()
                } catch (e) { console.warn('window.hide not available:', e) }
            }
        }
        checkStartMinimized()
    }, [])

    // Deep Links
    useDeepLinks(
        (url) => handleNewTask(url),
        (path) => router.navigate({ to: path })
    )

    // Local Server Listener
    useEffect(() => {
        let unlisten: Promise<() => void> | undefined;
        const setupServerListener = async () => {
            try {
                const { listen } = await import('@tauri-apps/api/event')
                unlisten = listen('server-v1-download', (event: any) => {
                    const { url, cookies, user_agent, start_time, end_time } = event.payload
                    if (url) handleNewTask(url, cookies, user_agent, start_time, end_time)
                })
            } catch (e) { console.error("Failed to setup server listener", e) }
        }
        setupServerListener()
        return () => { if (unlisten) unlisten.then(f => f()) }
    }, [handleNewTask])

    // Lazy Binary Validation
    useEffect(() => {
        const timer = setTimeout(async () => {
            const { runBinaryValidation } = await import('../lib/binary-validator')
            runBinaryValidation((entry) => {
                if (entry.level === 'error' || entry.level === 'warning') {
                    console.debug(`[LazyValidator] ${entry.message}`)
                }
            }, settings.language)
        }, 2000)
        return () => clearTimeout(timer)
    }, [])


    return (
        <TooltipProvider delayDuration={400} skipDelayDuration={500}>
            <MotionConfig transition={{ duration: 0.15, ease: "easeInOut" }}>
                <AppLayout isOffline={isOffline}>
                    <AppHeader
                        openDialog={openDialog}

                        onOpenGuide={() => setShowGuide(true)}
                        onOpenShortcuts={() => setShowShortcuts(true)}
                    />

                    <ShortcutsPopover isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
                    <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

                    {/* MAIN CONTENT OUTLET */}
                    <div className="flex-1 overflow-hidden relative flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 h-full overflow-hidden grid grid-cols-1 grid-rows-1">
                            <Outlet />
                        </div>
                    </div>

                    <ClipboardListener onFound={handleNewTask} onNotificationClick={handleNewTask} />

                    <AddDialog
                        ref={addDialogRef}
                        addTask={addTask}
                        initialUrl={clipboardUrl}
                        initialCookies={clipboardCookies}
                        initialUserAgent={clipboardUA}
                        initialStart={clipboardStart}
                        initialEnd={clipboardEnd}
                        isOffline={isOffline}
                    />

                    <Onboarding />

                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        visible={contextMenu.visible}
                        onClose={() => setContextMenu(c => ({ ...c, visible: false }))}
                    />

                    <StatusFooter />
                    <Toaster position="bottom-right" theme={settings.theme as any} richColors expand={true} className="!z-[9999]" toastOptions={{ style: { marginBottom: '28px', marginRight: '2px' } }} />
                </AppLayout>
            </MotionConfig>
        </TooltipProvider>
    )
}
