import { useEffect, useRef } from 'react'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { isPermissionGranted, requestPermission, sendNotification, onAction } from '@tauri-apps/plugin-notification'
import { platform } from '@tauri-apps/plugin-os'
import { translations } from '../../lib/locales'
import { useAppStore } from '../../store'
import { isValidVideoUrl } from '../../lib/validators'

console.log("[ClipboardListener] File Loaded (v10 - Stable)")

interface ClipboardListenerProps {
    onFound?: (url: string) => void
    onNotificationClick?: (url: string) => void
}

export function ClipboardListener({ onFound, onNotificationClick }: ClipboardListenerProps) {
    const settings = useAppStore((state) => state.settings)

    // Safe access to translations with fallback to English
    const language = settings?.language || 'en'
    const t = (translations[language as keyof typeof translations] || translations.en).monitor

    const lastTextRef = useRef<string>('')
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const detectedUrlRef = useRef<string | null>(null)

    // Handle Notification Clicks
    useEffect(() => {
        let unlisten: any = undefined

        const setupListener = async () => {
            try {
                const currentPlatform = await platform()
                console.log("[Notification] Initializing on platform:", currentPlatform)

                // onAction is supported on Desktop (Windows/macOS/Linux)
                unlisten = await onAction((notification) => {
                    console.log("[Notification] ACTION EVENT:", notification)

                    // Priority: extra.url > notification.body
                    const url = (notification.extra?.url as string) || (notification.body as string)

                    if (url && isValidVideoUrl(url)) {
                        console.log("[Notification] Valid URL found in click:", url)
                        if (onNotificationClick) {
                            // 1. Trigger App logic
                            onNotificationClick(url)

                            // 2. Bring window to front
                            import('@tauri-apps/api/window').then(async (m) => {
                                try {
                                    const win = m.getCurrentWindow()
                                    await win.show()
                                    await win.unminimize()
                                    await win.setFocus()
                                } catch (err) {
                                    console.warn("[Notification] Window focus failed:", err)
                                }
                            })
                        }
                    } else {
                        console.warn("[Notification] Click caught but no valid URL in notification:", notification)
                        // At least focus the app even if no URL
                        import('@tauri-apps/api/window').then(m => m.getCurrentWindow().setFocus())
                    }
                })
            } catch (error) {
                console.error("[Notification] Error setting up listener:", error)
            }
        }

        setupListener()

        return () => {
            if (unlisten) {
                console.log("[Notification] Cleaning up listener")
                if (typeof unlisten === 'function') unlisten()
                else if (unlisten && typeof unlisten.unlisten === 'function') unlisten.unlisten()
            }
        }
    }, [onNotificationClick])

    useEffect(() => {
        const checkClipboard = async () => {
            try {
                if (!settings.enableDesktopNotifications) return

                const text = await readText()
                if (!text) return
                if (text.length > 500) return
                if (text === lastTextRef.current) return

                lastTextRef.current = text

                if (isValidVideoUrl(text)) {
                    if (detectedUrlRef.current === text) return

                    detectedUrlRef.current = text

                    if (onFound) {
                        onFound(text)
                    }

                    // Send Native Notification
                    let permissionGranted = await isPermissionGranted()
                    if (!permissionGranted) {
                        const permission = await requestPermission()
                        permissionGranted = permission === 'granted'
                    }

                    if (permissionGranted) {
                        console.log("[Monitor] Sending notification for:", text)
                        sendNotification({
                            title: t.title,
                            body: text,
                            actionTypeId: 'DOWNLOAD_ACTION',
                            extra: { url: text },
                        })

                        useAppStore.getState().addLog({
                            message: `[Monitor] URL detected from clipboard: ${text}`,
                            type: 'info',
                            source: 'system'
                        })
                    }
                }
            } catch (e) {
                // Silently ignore clipboard errors
            }
        }

        // Poll every 3 seconds
        intervalRef.current = setInterval(checkClipboard, 3000)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [settings.enableDesktopNotifications, t.title, onFound])

    return null
}
