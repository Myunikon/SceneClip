import { invoke } from '@tauri-apps/api/core'
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
 * Note: estimateDownloadSize has been migrated to the Rust backend for performance and type-safety.
 */
export const estimateDownloadSize = async (meta: any, options: Partial<SizeEstimationOptions>): Promise<number> => {
    try {
        return await invoke<number>('estimate_download_size', {
            meta,
            options
        })
    } catch (e) {
        console.error("[Rust] Failed to estimate download size:", e)
        return 0
    }
}

