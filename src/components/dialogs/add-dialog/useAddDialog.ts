import { useState, useEffect, useRef } from 'react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { downloadDir } from '@tauri-apps/api/path'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../../store'
import { notify } from '../../../lib/notify'
import { formatBytes } from '../../../lib/utils'
import {
    getAvailableResolutions,
    getAvailableAudioBitrates,
    getAvailableVideoCodecs,
    getAvailableAudioCodecs,
    getAvailableLanguages,
    estimateDownloadSize
} from '../../../lib/mediaUtils'
import { isValidVideoUrl } from '../../../lib/validators'

import { useVideoMeta } from './useVideoMeta'
import { useDiskStats } from './useDiskStats'
import { useDialogForm } from './useDialogForm'
import { DownloadOptions } from '../../../types'

interface UseAddDialogProps {
    addTask: (url: string, opts: DownloadOptions) => Promise<void>
    initialUrl?: string
    initialCookies?: string
    initialUserAgent?: string
    initialStart?: number
    initialEnd?: number

    isOffline?: boolean
}

export function useAddDialog({ addTask, initialUrl, initialCookies, initialUserAgent, initialStart, initialEnd }: UseAddDialogProps) {
    const { settings } = useAppStore()
    const { t, i18n } = useTranslation()

    const [isOpen, setIsOpen] = useState(false)
    const [url, setUrl] = useState('')

    // Refs to avoid stale closures in async callbacks
    const urlRef = useRef(url)
    const initialUrlRef = useRef(initialUrl)

    // Keep refs in sync with state
    useEffect(() => { urlRef.current = url }, [url])
    useEffect(() => { initialUrlRef.current = initialUrl }, [initialUrl])

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

    // React to external URL triggers (Notification click, Deep link)
    // This MUST run whenever initialUrl changes to catch the updates
    // React to external URL triggers (Notification click, Deep link)
    // This MUST run whenever initialUrl changes to catch the updates
    useEffect(() => {
        if (initialUrl && initialUrl !== urlRef.current) {
            console.log("[AddDialog] Hydrating from external source:", initialUrl)
            setUrl(initialUrl)
            setIsOpen(true)
        }
    }, [initialUrl])

    // Auto-paste from Clipboard on Open (Fallback)
    useEffect(() => {
        if (!isOpen) return
        if (!settings.enableAutoClipboard) return

        // Use refs for fresh values in async callback (avoids stale closures)
        if (urlRef.current) return

        const checkClipboard = async () => {
            // Check fresh value inside async
            if (urlRef.current) return

            try {
                const text = await readText()
                if (text && isValidVideoUrl(text)) {
                    // Only auto-paste if we don't have an initialUrl conflicting
                    if (!initialUrlRef.current) {
                        setUrl(text)
                    }
                }
            } catch (e) {
                console.warn('Clipboard auto-read failed', e)
            }
        }
        checkClipboard()
    }, [isOpen])

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        if (isOpen) window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen])


    // Compute Available Formats & Options using pure utils
    const availableResolutions = getAvailableResolutions(meta || undefined)
    const availableAudioBitrates = getAvailableAudioBitrates(meta || undefined)
    const availableVideoCodecs = getAvailableVideoCodecs(meta || undefined)
    const availableAudioCodecs = getAvailableAudioCodecs(meta || undefined)
    const availableContainers = meta?.containers || []
    const availableLanguages = getAvailableLanguages(meta)

    // Estimated Size Calculation
    const estimatedSize = estimateDownloadSize(meta, options)

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
            ? url.split('\n').map(u => u.trim()).filter(u => isValidVideoUrl(u))
            : [url.trim()]

        // Final Validation
        if (urls.length === 0 || (!options.batchMode && !isValidVideoUrl(url))) {
            notify.error(t('dialog.invalid_url_title') || "Invalid URL", {
                description: t('dialog.invalid_url_desc') || "Please enter a valid video URL (http/https/rtmp/rtsp)"
            })
            return
        }

        for (const singleUrl of urls) {
            addTask(singleUrl, {
                path: savePath,
                format: options.format,
                container: options.container,
                customFilename: urls.length > 1 ? undefined : options.customFilename,
                rangeStart: options.isClipping ? start : undefined,
                rangeEnd: options.isClipping ? end : undefined,
                audioBitrate: options.audioBitrate,
                audioFormat: options.audioFormat as DownloadOptions['audioFormat'],

                removeSponsors: options.sponsorBlock,
                subtitles: options.subtitles,
                subtitleLang: options.subtitles ? options.subtitleLang : undefined,
                subtitleFormat: options.subtitles ? options.subtitleFormat : undefined,
                embedSubtitles: options.subtitles ? options.embedSubtitles : false,
                videoCodec: options.videoCodec,
                forceTranscode: options.videoCodec !== 'auto' && availableVideoCodecs && !availableVideoCodecs.includes(options.videoCodec),
                splitChapters: options.splitChapters,
                scheduledTime: options.isScheduled && options.scheduleTime ? new Date(options.scheduleTime).getTime() : undefined,
                audioNormalization: options.audioNormalization,
                gifFps: options.format === 'gif' ? options.gifFps : undefined,
                gifScale: options.format === 'gif' ? options.gifScale : undefined,
                gifQuality: options.format === 'gif' ? options.gifQuality : undefined,
                postProcessorArgs: options.postProcessorArgs,

                // Extension Data
                cookies: initialCookies,
                userAgent: initialUserAgent
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


    const isDiskFull = !!(estimatedSize > 0 && diskFreeSpace !== null && estimatedSize > diskFreeSpace)

    return {
        isOpen, setIsOpen,
        url, setUrl,
        options, setters, // Return grouped props
        meta, loadingMeta, errorMeta,
        availableResolutions, availableAudioBitrates, availableVideoCodecs, availableAudioCodecs, availableContainers, availableLanguages,
        handleSubmit, resetForm, browse, handlePaste,
        t,
        formatFileSize: (bytes?: number) => formatBytes(bytes || 0, 2, i18n.language),
        estimatedSize, // Return calculated size
        settings,
        isDiskFull,
        diskFreeSpace
    }
}
