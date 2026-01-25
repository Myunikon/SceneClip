/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Media Utilities
 * 
 * Contains pure functions for analyzing video metadata, calculating available formats,
 * and estimating file sizes. Extracted from useAddDialog to be reusable and testable.
 */

import { parseTime } from './utils'

export const getAvailableResolutions = (formats: any[] | undefined): number[] => {
    if (!formats) return []
    const heights = formats.map((f: any) => f.height).filter((h: any) => typeof h === 'number' && h > 0)
    return [...new Set(heights)].sort((a, b) => b - a) as number[]
}

export const getAvailableAudioBitrates = (formats: any[] | undefined): number[] => {
    if (!formats) return []
    const bitrates = formats
        .filter((f: any) => f.acodec !== 'none' && f.abr)
        .map((f: any) => Math.round(f.abr))

    // Group into common buckets
    const buckets = [64, 128, 192, 256, 320]
    const valid = bitrates.reduce((acc: number[], cur: number) => {
        // Find closest bucket
        const closest: number = buckets.reduce((prev, curr) => Math.abs(curr - cur) < Math.abs(prev - cur) ? curr : prev)
        if (!acc.includes(closest)) acc.push(closest)
        return acc
    }, [])

    return valid.sort((a: number, b: number) => b - a)
}

export const getAvailableVideoCodecs = (formats: any[] | undefined): string[] => {
    if (!formats) return []
    const codecs = new Set<string>()

    formats.forEach((f: any) => {
        if (!f.vcodec || f.vcodec === 'none') return

        const v = f.vcodec.toLowerCase()

        if (v.startsWith('avc1') || v.startsWith('h264')) codecs.add('h264')
        else if (v.startsWith('vp9')) codecs.add('vp9')
        else if (v.startsWith('av01')) codecs.add('av1')
        else if (v.startsWith('hev1') || v.startsWith('hvc1') || v.startsWith('hevc')) codecs.add('hevc')
    })

    return Array.from(codecs)
}

export const getAvailableAudioCodecs = (formats: any[] | undefined): string[] => {
    if (!formats) return []
    const codecs = new Set<string>()

    formats.forEach((f: any) => {
        if (!f.acodec || f.acodec === 'none') return

        const a = f.acodec.toLowerCase()
        if (a.startsWith('mp4a')) codecs.add('m4a')
        else if (a.includes('opus')) codecs.add('opus')
        else if (a.includes('vorbis')) codecs.add('ogg')
        else if (a.includes('flac')) codecs.add('flac')
        else if (a.includes('wav')) codecs.add('wav')
    })

    return Array.from(codecs)
}

export interface LanguageOption {
    id: string
    label: string
}

export const getAvailableLanguages = (meta: any): LanguageOption[] => {
    if (!meta) return []
    const list: LanguageOption[] = []

    // 1. Check Auto Captions
    if (meta?.automatic_captions && Object.keys(meta.automatic_captions).length > 0) {
        list.push({ id: 'auto', label: 'Auto (AI)' })
    }

    // 2. Check Manual Subtitles
    if (meta?.subtitles && Object.keys(meta.subtitles).length > 0) {
        // Extract distinct languages from manual subtitles
        const realLangs = Object.keys(meta.subtitles).map(code => {
            const info = meta.subtitles[code]
            const name = info && info[0] && info[0].name ? info[0].name : code.toUpperCase()
            return { id: code, label: name }
        })
        realLangs.sort((a, b) => a.label.localeCompare(b.label))
        list.push(...realLangs)

        // Add 'All' if we have manual subs
        list.push({ id: 'all', label: 'All' })
    }

    return list
}

export interface SizeEstimationOptions {
    isClipping: boolean
    rangeStart: string
    rangeEnd: string
    format: string
    audioBitrate: string
    gifScale: number
    gifFps: number
}

export const estimateDownloadSize = (meta: any, options: Partial<SizeEstimationOptions>): number => {
    if (!meta?.filesize_approx && !meta?.filesize && !meta?.formats) return 0

    const total = meta.duration || 1
    let ratio = 1

    if (options.isClipping) {
        const s = parseTime(options.rangeStart || '')
        const e = options.rangeEnd ? parseTime(options.rangeEnd) : total
        const duration = Math.max(0, Math.min(e, total) - Math.max(0, s))
        ratio = duration / total
    }

    let baseSize = 0
    // Try to get explicit matches from formats
    if (meta.formats) {
        const audioFormats = meta.formats.filter((f: any) => f.acodec !== 'none' && f.vcodec === 'none')
        const bestAudio = audioFormats.sort((a: any, b: any) => (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0))[0]
        const audioSize = bestAudio?.filesize || bestAudio?.filesize_approx || 0

        if (options.format === 'audio') {
            const targetBitrate = parseInt(options.audioBitrate || '128')
            if (audioFormats.length > 0) {
                const targetAudio = audioFormats.reduce((prev: any, curr: any) =>
                    (Math.abs((curr.abr || 0) - targetBitrate) < Math.abs((prev.abr || 0) - targetBitrate) ? curr : prev)
                )
                baseSize = targetAudio?.filesize || targetAudio?.filesize_approx || audioSize
            } else {
                baseSize = audioSize
            }
        } else if (options.format === 'gif') {
            // GIF Logic
            const h = options.gifScale || (meta as any).height || 480
            const fps = options.gifFps || 15
            // Base factor heuristic: 480p @ 15fps ~ 4Mbit/s ~ 0.5MB/s
            // This is a rough estimation
            const baseFactor = (h / 480) * (fps / 15) * 0.5 * 1024 * 1024
            baseSize = baseFactor * total
        } else if (options.format === 'Best') {
            const videoFormats = meta.formats.filter((f: any) => f.vcodec !== 'none')
            const bestVideo = videoFormats.sort((a: any, b: any) => (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0))[0]
            baseSize = (bestVideo?.filesize || bestVideo?.filesize_approx || 0) + audioSize
        } else {
            const targetHeight = parseInt(options.format || '0')
            const videoFormats = meta.formats.filter((f: any) => f.height === targetHeight && f.vcodec !== 'none')
            if (videoFormats.length > 0) {
                const bestVideo = videoFormats.sort((a: any, b: any) => (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0))[0]
                baseSize = (bestVideo?.filesize || bestVideo?.filesize_approx || 0) + audioSize
            } else {
                // Fallback if specific resolution not found in formats but approx size exists in meta
                baseSize = meta.filesize_approx || meta.filesize || 0
            }
        }
    } else {
        baseSize = meta.filesize_approx || meta.filesize || 0
    }

    return baseSize * ratio
}
