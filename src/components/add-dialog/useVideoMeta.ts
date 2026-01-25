import { useState, useEffect, useRef } from 'react'
import { notify } from '../../lib/notify'
import { parseYtDlpJson } from '../../lib/ytdlp'
import { VideoMeta } from '../../types'

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

        debounceRef.current = setTimeout(async () => {
            try {
                // Use shared sidecar command factory
                const { getYtDlpCommand } = await import('../../lib/ytdlp')
                const cmd = await getYtDlpCommand(['--dump-json', '--no-warnings', '--', url])
                const output = await cmd.execute()

                if (output.code === 0) {
                    const data = parseYtDlpJson(output.stdout)
                    setMeta(data)
                } else {
                    throw new Error(output.stderr)
                }
            } catch (e: unknown) {
                console.error("Metadata fetch failed", e)
                notify.error("Failed to fetch video info", { description: e instanceof Error ? e.message : "Check URL and connection" })
                setError(true)
                setMeta(null)
            } finally {
                setLoading(false)
            }
        }, 1000)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [url])

    return { meta, loading, error, setMeta }
}
