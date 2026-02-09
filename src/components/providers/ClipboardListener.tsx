import { useEffect } from 'react'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { isPermissionGranted, requestPermission, sendNotification, onAction } from '@tauri-apps/plugin-notification'
import { translations } from '../../lib/locales'
import { useAppStore } from '../../store'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface ClipboardListenerProps {
    onFound?: (url: string) => void
    onNotificationClick?: (url: string) => void
}

export function ClipboardListener({ onFound, onNotificationClick }: ClipboardListenerProps) {
    const settings = useAppStore((state) => state.settings)
    const language = settings?.language || 'en'
    const t = (translations[language as keyof typeof translations] || translations.en).monitor

    // 1. Notification Action Listener (Click on notification)
    useEffect(() => {
        let unlisten: { unregister: () => void | Promise<void> } | undefined
        let isMounted = true

        const setupActionListener = async () => {
            try {
                // Unified Permission Check
                let permission = await isPermissionGranted()
                if (!permission) {
                    const status = await requestPermission()
                    permission = status === 'granted'
                }

                if (!permission) {
                    console.debug('[ClipboardListener] Permission denied for notifications.')
                    return
                }

                const u = await onAction((notification) => {
                    const url = (notification.extra?.url as string) || (notification.body as string)
                    if (url && onNotificationClick) {
                        onNotificationClick(url)
                        const win = getCurrentWindow()
                        win.show().catch(() => { })
                        win.unminimize().catch(() => { })
                        win.setFocus().catch(() => { })
                    }
                })

                if (isMounted) {
                    unlisten = u
                } else {
                    u.unregister()
                }
            } catch (err) {
                console.debug('[Notification] Action listener failed:', err)
            }
        }

        setupActionListener()

        return () => {
            isMounted = false
            if (unlisten) unlisten.unregister()
        }
    }, [onNotificationClick])

    // 2. Listen for Backend 'link-detected' Event
    useEffect(() => {
        if (!settings.enableAutoClipboard) return

        let unlistenFn: UnlistenFn | undefined
        let isMounted = true

        const setupBackendListener = async () => {
            try {
                const u = await listen<string>('link-detected', async (event) => {
                    const url = event.payload

                    // Basic URL validation
                    try {
                        new URL(url)
                    } catch {
                        console.warn('[ClipboardListener] Invalid URL received:', url)
                        return
                    }

                    if (onFound) onFound(url)

                    // Send Native Notification (Only if enabled globally)
                    if (settings.enableDesktopNotifications) {
                        let permission = await isPermissionGranted()
                        if (!permission) {
                            const status = await requestPermission()
                            permission = status === 'granted'
                        }

                        if (permission) {
                            sendNotification({
                                title: t.title,
                                body: url,
                                actionTypeId: 'DOWNLOAD_ACTION',
                                extra: { url },
                            })

                            useAppStore.getState().addLog({
                                message: `[Monitor] URL detected: ${url}`,
                                level: 'info',
                                source: 'system'
                            })
                        }
                    }
                })

                if (isMounted) {
                    unlistenFn = u
                } else {
                    u()
                }
            } catch (error) {
                console.error("Failed to setup link-detected listener:", error)
            }
        }

        setupBackendListener()

        return () => {
            isMounted = false
            if (unlistenFn) unlistenFn()
        }
    }, [settings.enableAutoClipboard, settings.enableDesktopNotifications, t.title, onFound])

    return null
}
