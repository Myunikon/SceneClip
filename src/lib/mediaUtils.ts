import { invoke } from '@tauri-apps/api/core'
import { parseTime } from './utils'

export interface LanguageOption {
    id: string
    label: string
}

export interface ParsedMetadata {
    title: string
    duration: number
    resolutions: number[]
    audioBitrates: number[]
    videoCodecs: string[]
    audioCodecs: string[]
    languages: LanguageOption[]
    thumbnail?: string
    filesize?: number
    filesizeApprox?: number
}

/**
 * Parses raw yt-dlp JSON metadata using the Rust backend.
 * Logic migrated to Rust for type safety and stability.
 */
export const parseVideoMetadata = async (rawJson: any): Promise<ParsedMetadata> => {
    try {
        return await invoke<ParsedMetadata>('parse_video_metadata', { rawJson })
    } catch (error) {
        console.error("[Rust] Failed to parse video metadata:", error)
        throw error
    }
}

// Backward compatibility helpers (optimized to use parsed metadata if available)

/**
 * @deprecated Use the new parseVideoMetadata (Rust) instead. This legacy path is kept for backward compatibility.
 */
export const getAvailableResolutions = (meta: ParsedMetadata | any[] | undefined): number[] => {
    if (!meta) return []
    if (Array.isArray(meta)) {
        // Legacy path (used in some components)
        const heights = meta.map((f: any) => f.height).filter((h: any) => typeof h === 'number' && h > 0)
        return [...new Set(heights)].sort((a, b) => b - a) as number[]
    }
    return meta.resolutions
}

/**
 * @deprecated Use the new parseVideoMetadata (Rust) instead. This legacy path is kept for backward compatibility.
 */
export const getAvailableAudioBitrates = (meta: ParsedMetadata | any[] | undefined): number[] => {
    if (!meta) return []
    if (Array.isArray(meta)) {
        // Legacy path
        const bitrates = meta
            .filter((f: any) => f.acodec !== 'none' && f.abr)
            .map((f: any) => Math.round(f.abr))

        const buckets = [64, 128, 192, 256, 320]
        const valid = bitrates.reduce((acc: number[], cur: number) => {
            const closest: number = buckets.reduce((prev, curr) => Math.abs(curr - cur) < Math.abs(prev - cur) ? curr : prev)
            if (!acc.includes(closest)) acc.push(closest)
            return acc
        }, [])
        return valid.sort((a: number, b: number) => b - a)
    }
    return meta.audioBitrates
}

/**
 * @deprecated Use the new parseVideoMetadata (Rust) instead. This legacy path is kept for backward compatibility.
 */
export const getAvailableVideoCodecs = (meta: ParsedMetadata | any[] | undefined): string[] => {
    if (!meta) return []
    if (Array.isArray(meta)) {
        // Legacy path
        const codecs = new Set<string>()
        meta.forEach((f: any) => {
            if (!f.vcodec || f.vcodec === 'none') return
            const v = f.vcodec.toLowerCase()
            if (v.startsWith('avc1') || v.startsWith('h264')) codecs.add('h264')
            else if (v.startsWith('vp9')) codecs.add('vp9')
            else if (v.startsWith('av01')) codecs.add('av1')
            else if (v.startsWith('hev1') || v.startsWith('hvc1') || v.startsWith('hevc')) codecs.add('hevc')
        })
        return Array.from(codecs)
    }
    return meta.videoCodecs
}

/**
 * @deprecated Use the new parseVideoMetadata (Rust) instead. This legacy path is kept for backward compatibility.
 */
export const getAvailableAudioCodecs = (meta: ParsedMetadata | any[] | undefined): string[] => {
    if (!meta) return []
    if (Array.isArray(meta)) {
        // Legacy path
        const codecs = new Set<string>()
        meta.forEach((f: any) => {
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
    return meta.audioCodecs
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

