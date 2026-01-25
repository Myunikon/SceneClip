import { useEffect } from 'react'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'

export function useDeepLinks(
    onDownload: (url: string) => void,
    onNavigate: (path: string) => void
) {
    useEffect(() => {
        let unlisten: Promise<() => void> | undefined;

        const setupListener = async () => {
            try {
                unlisten = onOpenUrl(async (urls) => {
                    console.log('Deep link received:', urls)
                    for (const url of urls) {
                        try {
                            const urlObj = new URL(url)
                            // clipscene://download?url=...
                            // clipscene://settings
                            // clipscene://history

                            const host = urlObj.host // 'download', 'settings', 'history'

                            if (host === 'download') {

                                // Better to stick to param: clipscene://download?url=...
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
            } catch (e) {
                console.error('Deep link plugin not initialized', e)
            }
        }

        setupListener()

        return () => {
            if (unlisten) unlisten.then(f => f())
        }
    }, [onDownload, onNavigate])
}
