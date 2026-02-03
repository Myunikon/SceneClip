import { useState, useEffect, useRef } from 'react'
import { notify } from '../../../lib/notify'
import { VideoMeta } from '../../../types'
import { useAppStore } from '../../../store'

export function useVideoMeta(url: string) {
    const [meta, setMeta] = useState<VideoMeta | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!url || !url.startsWith('http')) {
            setMeta(null)
            setError(false)
            return
        }

        if (debounceRef.current) clearTimeout(debounceRef.current)

        setLoading(true)
        setError(false)

        // Cleanup flag to prevent setState on unmounted component
        let isCancelled = false

        debounceRef.current = setTimeout(async () => {
            try {
                // Use backend command
                const { invoke } = await import('@tauri-apps/api/core')
                const settings = useAppStore.getState().settings

                // Backend returns generic JSON, we cast it to partial VideoMeta
                // or just any if structure differs slightly, but VideoMeta is expected
                const data = await invoke<VideoMeta>('get_video_metadata', {
                    url,
                    settings
                })

                // Compute convenience flags
                if (data) {
                    data.hasSubtitles = (data.subtitles && Object.keys(data.subtitles).length > 0) ||
                        (data.automatic_captions && Object.keys(data.automatic_captions).length > 0)
                }

                if (!isCancelled) setMeta(data)
            } catch (e: unknown) {
                if (!isCancelled) {
                    console.error("Metadata fetch failed", e)
                    notify.error("Failed to fetch video info", { description: e instanceof Error ? e.message : "Check URL and connection" })
                    setError(true)
                    setMeta(null)
                }
            } finally {
                if (!isCancelled) setLoading(false)
            }
        }, 1000)

        return () => {
            isCancelled = true
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [url])

    return { meta, loading, error, setMeta }
}
