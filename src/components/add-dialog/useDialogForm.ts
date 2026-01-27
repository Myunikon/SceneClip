import { useState, useEffect } from 'react'
import { DialogOptions, DialogOptionSetters, AppSettings } from '../../types'

interface UseDialogToProps {
    initialStart?: number
    initialEnd?: number
    settings: AppSettings
}

export function useDialogForm({ initialStart, initialEnd, settings }: UseDialogToProps) {
    // ----------------------------------------------------
    // State Definitions
    // ----------------------------------------------------
    const [format, setFormat] = useState('Best')
    const [path, setPath] = useState(
        settings.downloadPath ||
        ''
    )
    const [rangeStart, setRangeStart] = useState(initialStart ? String(initialStart) : '')
    const [rangeEnd, setRangeEnd] = useState(initialEnd ? String(initialEnd) : '')
    const [sponsorBlock, setSponsorBlock] = useState(false)
    const [customFilename, setCustomFilename] = useState('')
    const [batchMode, setBatchMode] = useState(false)
    const [audioBitrate, setAudioBitrate] = useState('192')
    const [audioFormat, setAudioFormat] = useState('mp3')
    const [subtitles, setSubtitles] = useState(false)
    const [subtitleLang, setSubtitleLang] = useState('auto')
    const [subtitleFormat, setSubtitleFormat] = useState<string | undefined>(undefined)
    const [embedSubtitles, setEmbedSubtitles] = useState(true)
    const [isScheduled, setIsScheduled] = useState(false)
    const [scheduleTime, setScheduleTime] = useState('')
    const [videoCodec, setVideoCodec] = useState<'auto' | 'av1' | 'h264' | 'hevc' | 'vp9'>('auto')
    const [splitChapters, setSplitChapters] = useState(false)
    const [container, setContainer] = useState<string>(
        settings.container ||
        'mp4'
    )
    const [audioNormalization, setAudioNormalization] = useState(settings.audioNormalization)
    const [isClipping, setIsClipping] = useState(!!(initialStart || initialEnd))
    const [proxy, setProxy] = useState('')

    // GIF Options State
    const [gifFps, setGifFps] = useState(15)
    const [gifScale, setGifScale] = useState(480)
    const [gifQuality, setGifQuality] = useState<'high' | 'fast'>('fast')

    // Feature 5
    const [postProcessorArgs, setPostProcessorArgs] = useState('')



    // ----------------------------------------------------
    // Effects / Side Logic
    // ----------------------------------------------------

    // Auto-enable Trim for GIFs
    useEffect(() => {
        if (format === 'gif') {
            setIsClipping(true)
        }
    }, [format])

    // Safety Guard: Mutually Exclusive clipping & sponsor block
    useEffect(() => {
        if (isClipping) {
            setSponsorBlock(false)
        }
    }, [isClipping])

    // Safety Guard: Reset Codec when Container changes
    useEffect(() => {
        setVideoCodec('auto')
    }, [container])


    // ----------------------------------------------------
    // Reset Logic
    // ----------------------------------------------------
    const resetForm = () => {
        setFormat('Best')
        setVideoCodec('auto')
        setContainer('mp4')
        setCustomFilename('')
        setRangeStart('')
        setRangeEnd('')
        setIsScheduled(false)
        setScheduleTime('')
        setGifFps(15)
        setGifScale(480)
        setGifQuality('fast')
        setProxy('')
        setPostProcessorArgs('')
    }

    // ----------------------------------------------------
    // Output Construction
    // ----------------------------------------------------
    const options: DialogOptions = {
        format, container, path, customFilename,
        audioBitrate, audioFormat, audioNormalization,
        videoCodec,
        sponsorBlock, splitChapters,
        subtitles, subtitleLang, subtitleFormat, embedSubtitles,
        isScheduled, scheduleTime,
        proxy,
        batchMode,
        isClipping, rangeStart, rangeEnd,
        gifFps, gifScale, gifQuality,
        postProcessorArgs
    }

    const setters: DialogOptionSetters = {
        setFormat, setContainer, setPath, setCustomFilename,
        setAudioBitrate, setAudioFormat, setAudioNormalization,
        setVideoCodec,
        setSponsorBlock, setSplitChapters,
        setSubtitles, setSubtitleLang, setSubtitleFormat, setEmbedSubtitles,
        setIsScheduled, setScheduleTime,
        setProxy,
        setBatchMode,
        setIsClipping, setRangeStart, setRangeEnd,
        setGifFps, setGifScale, setGifQuality,
        setPostProcessorArgs
    }

    return {
        options,
        setters,
        resetForm,
        // Expose specific setters if needed elsewhere (most context uses 'setters' object)
        setPath // Explicitly exposed for file browsing
    }
}
