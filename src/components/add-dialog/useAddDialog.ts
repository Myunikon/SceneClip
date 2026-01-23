import { useState, useEffect, useMemo } from 'react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { downloadDir } from '@tauri-apps/api/path'
import { useAppStore } from '../../store'
import { translations } from '../../lib/locales'
import { notify } from '../../lib/notify'
import { formatBytes } from '../../lib/utils'
import {
    getAvailableResolutions,
    getAvailableAudioBitrates,
    getAvailableVideoCodecs,
    getAvailableAudioCodecs,
    getAvailableLanguages,
    estimateDownloadSize
} from '../../lib/mediaUtils'

import { useVideoMeta } from './useVideoMeta'
import { useDiskStats } from './useDiskStats'
import { useDialogForm } from './useDialogForm'

interface UseAddDialogProps {
    addTask: (url: string, opts: any) => any
    initialUrl?: string
    initialCookies?: string
    initialUserAgent?: string
    initialStart?: number
    initialEnd?: number
    previewLang?: string | null
    isOffline?: boolean
}

export function useAddDialog({ addTask, initialUrl, initialCookies, initialUserAgent, initialStart, initialEnd, previewLang }: UseAddDialogProps) {
    const { settings } = useAppStore()
    const t = translations[(previewLang ?? settings.language) as keyof typeof translations].dialog

    const [isOpen, setIsOpen] = useState(false)
    const [url, setUrl] = useState('')

    // 1. Form State Hook
    const { options, setters, resetForm, setPath } = useDialogForm({
        initialStart,
        initialEnd,
        settings
    })

    // 2. Metadata Hook
    const { meta, loading: loadingMeta, error: errorMeta } = useVideoMeta(url)

    // 3. Disk Stats Hook
    const { diskFreeSpace } = useDiskStats(options.path, isOpen)

    // Auto-paste initial URL
    useEffect(() => {
        if (initialUrl) setUrl(initialUrl)
    }, [initialUrl])

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        if (isOpen) window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen])


    // Compute Available Formats & Options using pure utils
    const availableResolutions = useMemo(() => getAvailableResolutions(meta?.formats), [meta])
    const availableAudioBitrates = useMemo(() => getAvailableAudioBitrates(meta?.formats), [meta])
    const availableVideoCodecs = useMemo(() => getAvailableVideoCodecs(meta?.formats), [meta])
    const availableAudioCodecs = useMemo(() => getAvailableAudioCodecs(meta?.formats), [meta])
    const availableLanguages = useMemo(() => getAvailableLanguages(meta), [meta])

    // Memoize Estimated Size Calculation
    const estimatedSize = useMemo(() => {
        return estimateDownloadSize(meta, options)
    }, [meta, options])

    // Moved formatFileSize to lib/utils/formatBytes


    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        let savePath = options.path

        // Always Ask Where to Save
        if (settings.alwaysAskPath && !savePath) {
            const selectedPath = await openDialog({ directory: true, title: 'Choose Download Location' })
            if (selectedPath) {
                savePath = selectedPath
            } else {
                return
            }
        } else if (!savePath) {
            savePath = await downloadDir()
        }

        const start = options.isClipping ? options.rangeStart : ''
        const end = options.isClipping ? options.rangeEnd : ''

        const urls = options.batchMode
            ? url.split('\n').map(u => u.trim()).filter(u => u.length > 0 && u.startsWith('http'))
            : [url.trim()]

        for (const singleUrl of urls) {
            addTask(singleUrl, {
                path: savePath,
                format: options.format,
                container: options.container,
                customFilename: urls.length > 1 ? undefined : options.customFilename,
                rangeStart: options.isClipping ? start : undefined,
                rangeEnd: options.isClipping ? end : undefined,
                audioBitrate: options.audioBitrate,
                audioFormat: options.audioFormat,

                removeSponsors: options.sponsorBlock,
                subtitles: options.subtitles,
                subtitleLang: options.subtitles ? options.subtitleLang : undefined,
                subtitleFormat: options.subtitles ? options.subtitleFormat : undefined,
                embedSubtitles: options.subtitles ? options.embedSubtitles : false,
                videoCodec: options.videoCodec,
                forceTranscode: options.videoCodec !== 'auto' && availableVideoCodecs && !availableVideoCodecs.includes(options.videoCodec),
                splitChapters: options.splitChapters,
                scheduledTime: options.isScheduled && options.scheduleTime ? new Date(options.scheduleTime).toISOString() : undefined,
                audioNormalization: options.audioNormalization,
                gifFps: options.format === 'gif' ? options.gifFps : undefined,
                gifScale: options.format === 'gif' ? options.gifScale : undefined,
                gifQuality: options.format === 'gif' ? options.gifQuality : undefined,

                // Extension Data
                cookies: initialCookies,
                userAgent: initialUserAgent
            })
        }

        if (!options.batchMode && urls.length === 1) {
            const { setSetting } = useAppStore.getState()
            setSetting('lastDownloadOptions', {
                format: options.format,
                container: options.container,
                audioBitrate: options.audioBitrate,
                removeSponsors: options.sponsorBlock,
                subtitles: options.subtitles,
                subtitleLang: options.subtitles ? options.subtitleLang : undefined,
                embedSubtitles: options.subtitles ? options.embedSubtitles : false,
                videoCodec: options.videoCodec,
                path: savePath
            })
        }

        setIsOpen(false)
        resetForm()
        setUrl('')
    }

    const browse = async () => {
        const p = await openDialog({ directory: true })
        if (p) setPath(p)
    }

    const handlePaste = async () => {
        try {
            const text = await readText();
            if (text) {
                setUrl(text);
                return;
            }
        } catch (e) {
            console.warn('Tauri clipboard failed, trying Web API', e);
        }

        try {
            const text = await navigator.clipboard.readText();
            if (text) setUrl(text);
        } catch (e) {
            console.error('All clipboard paste attempts failed', e);
            notify.error("Clipboard access denied or empty");
        }
    }

    const quickDownload = async (targetUrl: string) => {
        if (!settings.quickDownloadEnabled || !settings.lastDownloadOptions) {
            return false
        }

        const lastOpts = settings.lastDownloadOptions
        const savePath = lastOpts.path || settings.downloadPath || await downloadDir()

        addTask(targetUrl, {
            ...lastOpts,
            path: savePath,
            customFilename: undefined
        })

        return true
    }

    const isDiskFull = !!(estimatedSize > 0 && diskFreeSpace !== null && estimatedSize > diskFreeSpace)

    return {
        isOpen, setIsOpen,
        url, setUrl,
        options, setters, // Return grouped props
        meta, loadingMeta, errorMeta,
        availableResolutions, availableAudioBitrates, availableVideoCodecs, availableAudioCodecs, availableLanguages,
        handleSubmit, resetForm, browse, handlePaste, quickDownload,
        t,
        formatFileSize: formatBytes,
        estimatedSize, // Return calculated size
        settings,
        isDiskFull,
        diskFreeSpace
    }
}
