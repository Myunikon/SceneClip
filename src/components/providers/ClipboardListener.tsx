import { useEffect, useRef } from 'react'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import { translations } from '../../lib/locales'
import { useAppStore } from '../../store'
import { isValidVideoUrl } from '../../lib/validators'

interface ClipboardListenerProps {
    onFound?: (url: string) => void
}

export function ClipboardListener({ onFound }: ClipboardListenerProps) {
    const settings = useAppStore((state) => state.settings)

    // Safe access to translations with fallback to English
    const language = settings?.language || 'en'
    const t = (translations[language as keyof typeof translations] || translations.en).monitor

    const lastTextRef = useRef<string>('')
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const detectedUrlRef = useRef<string | null>(null)

    useEffect(() => {
        const checkClipboard = async () => {
            try {
                // If native notifications are disabled, we don't need to check actively
                // unless we want to keep internal state, but for now we only care about notifying
                if (!settings.enableDesktopNotifications) return

                const text = await readText()
                if (!text) return

                // SAFETY GUARD: Ignore massive text blocks (novels, code dumps)
                if (text.length > 500) return

                // Ignore if same as last check
                if (text === lastTextRef.current) return

                lastTextRef.current = text

                // Check if it's a video URL
                if (isValidVideoUrl(text)) {
                    // Ignore if we just detected this specific URL
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
                        sendNotification({
                            title: t.title,
                            body: text,
                            actionTypeId: 'DOWNLOAD_ACTION',
                            extra: { url: text }
                        })

                        useAppStore.getState().addLog({
                            message: `[Monitor] URL detected from clipboard: ${text}`,
                            type: 'info',
                            source: 'system'
                        })
                    }
                }
            } catch (e) {
                // Suppress common clipboard errors (empty, locked, format mismatch)
                const msg = String(e)
                if (msg.includes('empty') || msg.includes('not available')) {
                    return
                }
                console.error("Clipboard Access Error:", e)
            }
        }

        // Poll every 3 seconds
        intervalRef.current = setInterval(checkClipboard, 3000)

        // Setup Notification Click Listener
        // Note: Future implementation for handling notification clicks can be added here
        // currently we rely on default system behavior or simple app focus

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [settings.enableDesktopNotifications, t.title, onFound])

    return null // No UI component
}
