import { useEffect, useRef } from 'react'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'

export function useDeepLinks(
    onDownload: (url: string) => void,
    onNavigate: (path: string) => void
) {
    // Use a ref to store the unlisten function so it persists across renders
    // and is accessible in the cleanup function even if setup completes later.
    const unlistenRef = useRef<() => void | undefined>(undefined)

    useEffect(() => {
        const setupListener = async () => {
            try {
                // If we already have a listener (shouldn't happen with strict effect cleanup, but good safety),
                // clear it first.
                if (unlistenRef.current) {
                    unlistenRef.current()
                }

                const unlisten = await onOpenUrl(async (urls) => {
                    // Note: onOpenUrl actually returns Promise<UnlistenFn>, we await it here
                    console.log('Deep link received:', urls)
                    for (const url of urls) {
                        try {
                            // Basic validation: ensure it's a valid URL scheme
                            const urlObj = new URL(url)
                            if (urlObj.protocol !== 'clipscene:') {
                                console.warn('Ignored invalid deep link protocol:', url)
                                continue
                            }

                            // clipscene://download?url=...
                            // clipscene://settings
                            // clipscene://history

                            const host = urlObj.host // 'download', 'settings', 'history'

                            if (host === 'download') {
                                const paramUrl = urlObj.searchParams.get('url')
                                if (paramUrl) onDownload(paramUrl)
                            } else if (host === 'settings') {
                                onNavigate('/settings')
                            } else if (host === 'history') {
                                onNavigate('/history')
                            }
                        } catch (e) {
                            console.error('Failed to parse deep link:', e)
                        }
                    }
                })

                unlistenRef.current = unlisten
            } catch (e) {
                console.error('Deep link plugin not initialized', e)
            }
        }

        setupListener()

        return () => {
            if (unlistenRef.current) {
                unlistenRef.current()
                unlistenRef.current = undefined
            }
        }
    }, [onDownload, onNavigate])
}
