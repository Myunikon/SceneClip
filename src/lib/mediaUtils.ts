import { invoke } from '@tauri-apps/api/core'
import { parseTime } from './utils'
import { VideoMeta } from '../types'

export interface LanguageOption {
    id: string
    label: string
}

export interface ParsedMetadata extends VideoMeta { }

/**
 * Parses raw yt-dlp JSON metadata using the Rust backend.
 */
export const parseVideoMetadata = async (rawJson: any): Promise<VideoMeta> => {
    try {
        // Now returns the fully populated object directly from backend command
        return await invoke<VideoMeta>('get_video_metadata', { rawJson })
    } catch (error) {
        console.error("[Rust] Failed to parse video metadata:", error)
        throw error
    }
}


export const getAvailableResolutions = (meta: VideoMeta | undefined): number[] => {
    if (!meta) return []
    return meta.resolutions || []
}

export const getAvailableAudioBitrates = (meta: VideoMeta | undefined): number[] => {
    if (!meta) return []
    return meta.audioBitrates || []
}

export const getAvailableVideoCodecs = (meta: VideoMeta | undefined): string[] => {
    if (!meta) return []
    return meta.videoCodecs || []
}

export const getAvailableAudioCodecs = (meta: VideoMeta | undefined): string[] => {
    if (!meta) return []
    return meta.audioCodecs || []
}

/**
 * @deprecated Use the new parseVideoMetadata (Rust) instead. This legacy path is kept for backward compatibility.
 */
export const getAvailableLanguages = (meta: ParsedMetadata | any): LanguageOption[] => {
    if (!meta) return []
    if (meta.languages) return meta.languages

    // Legacy path
    const list: LanguageOption[] = []
    if (meta?.automatic_captions && Object.keys(meta.automatic_captions).length > 0) {
        list.push({ id: 'auto', label: 'Auto (AI)' })
    }
    if (meta?.subtitles && Object.keys(meta.subtitles).length > 0) {
        const realLangs = Object.keys(meta.subtitles).map(code => {
            const info = meta.subtitles[code]
            const name = info && info[0] && info[0].name ? info[0].name : code.toUpperCase()
            return { id: code, label: name }
        })
        realLangs.sort((a, b) => a.label.localeCompare(b.label))
        list.push(...realLangs)
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

/**
 * Note: estimateDownloadSize logic is complex and relies on specific format selection.
 * For now, we keep it in TS but it is a candidate for the next migration phase.
 */
export const estimateDownloadSize = (meta: any, options: Partial<SizeEstimationOptions>): number => {
    if (!meta) return 0
    const filesize = meta.filesize || meta.filesizeApprox || 0
    if (!filesize && !meta.formats) return 0

    const total = meta.duration || 1
    let ratio = 1

    if (options.isClipping) {
        const s = parseTime(options.rangeStart || '')
        const e = options.rangeEnd ? parseTime(options.rangeEnd) : total
        const duration = Math.max(0, Math.min(e, total) - Math.max(0, s))
        ratio = duration / total
    }

    let baseSize = 0
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
            const h = options.gifScale || meta.height || 480
            const fps = options.gifFps || 15
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
                baseSize = filesize
            }
        }
    } else {
        baseSize = filesize
    }

    return baseSize * ratio
}

