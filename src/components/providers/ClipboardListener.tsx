import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { isPermissionGranted, requestPermission, sendNotification, onAction } from '@tauri-apps/plugin-notification'
import { translations } from '../../lib/locales'
import { useAppStore } from '../../store'

interface ClipboardListenerProps {
    onFound?: (url: string) => void
    onNotificationClick?: (url: string) => void
}

export function ClipboardListener({ onFound, onNotificationClick }: ClipboardListenerProps) {
    const settings = useAppStore((state) => state.settings)
    const language = settings?.language || 'en'
    const t = (translations[language as keyof typeof translations] || translations.en).monitor

    useEffect(() => {
        let unlisten: { unregister: () => Promise<void> } | undefined
        let mounted = true

        const setupActionListener = async () => {
            try {
                // Check if notifications are enabled first
                const permissionGranted = await isPermissionGranted()
                if (!permissionGranted) return

                const u = await onAction((notification) => {
                    const url = (notification.extra?.url as string) || (notification.body as string)
                    if (url) {
                        if (onNotificationClick) {
                            onNotificationClick(url)
                            import('@tauri-apps/api/window').then(async (m) => {
                                try {
                                    const win = m.getCurrentWindow()
                                    await win.show()
                                    await win.unminimize()
                                    await win.setFocus()
                                } catch (err) { /* ignore */ }
                            })
                        }
                    }
                })

                if (mounted) unlisten = u
                else u.unregister()
            } catch (err) {
                // Notification listener not available or permission denied - ignore gracefully
                console.debug('[Notification] Action listener not available:', err)
            }
        }

        setupActionListener()

        return () => {
            mounted = false
            if (unlisten) unlisten.unregister()
        }
    }, [onNotificationClick])

    // 2. Listen for Backend 'link-detected' Event
    useEffect(() => {
        let unlisten: (() => void) | undefined
        let mounted = true

        listen<string>('link-detected', async (event) => {
            const url = event.payload
            if (!settings.enableDesktopNotifications) return

            // Trigger UI (AddDialog)
            if (onFound) onFound(url)

            // Send Native Notification
            let permissionGranted = await isPermissionGranted()
            if (!permissionGranted) {
                const permission = await requestPermission()
                permissionGranted = permission === 'granted'
            }

            if (permissionGranted) {
                sendNotification({
                    title: t.title,
                    body: url,
                    actionTypeId: 'DOWNLOAD_ACTION',
                    extra: { url },
                })

                useAppStore.getState().addLog({
                    message: `[Monitor] URL detected from backend: ${url}`,
                    level: 'info',
                    source: 'system'
                })
            }
        }).then((u) => {
            if (mounted) unlisten = u
            else u()
        })

        return () => {
            mounted = false
            if (unlisten) unlisten()
        }
    }, [settings.enableDesktopNotifications, t.title, onFound])

    return null
}
