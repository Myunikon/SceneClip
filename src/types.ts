import { translations } from './lib/locales'
import { VideoChapter } from './store/slices/types'

// Standard yt-dlp Format Object
export interface YtFormat {
    format_id: string
    format_note?: string
    ext: string
    acodec?: string
    vcodec?: string
    url: string
    width?: number
    height?: number
    filesize?: number
    filesize_approx?: number
    fps?: number
    abr?: number // Audio Bitrate
    tbr?: number // Total Bitrate
}

// Subtitle Track Info
export interface YtSubtitle {
    ext: string
    url: string
    name?: string
}

// Extracted Metadata
export interface VideoMeta {
    id?: string
    title: string
    thumbnail: string
    duration?: number
    uploader?: string
    description?: string
    view_count?: number
    upload_date?: string
    formats?: YtFormat[]
    subtitles?: Record<string, YtSubtitle[]>
    automatic_captions?: Record<string, YtSubtitle[]>
    hasSubtitles?: boolean
    filesize_approx?: number
    chapters?: VideoChapter[]
    is_live?: boolean
}

// System Stats
export interface DiskStats {
    disk_free: number
    disk_total: number
}

// Type for Translations (Inferred from English locale)
export type AppTranslations = typeof translations['en']

// Grouped Dialog Options State
export interface DialogOptions {
    format: string
    container: string
    path: string
    customFilename: string
    // Audio
    audioBitrate: string
    audioFormat: string
    audioNormalization: boolean
    // Video
    videoCodec: 'auto' | 'av1' | 'h264' | 'hevc' | 'vp9'
    // Enhancements
    sponsorBlock: boolean
    splitChapters: boolean
    // Subtitles
    subtitles: boolean
    subtitleLang: string
    subtitleFormat: string | undefined
    embedSubtitles: boolean
    // Scheduling
    isScheduled: boolean
    scheduleTime: string
    // Network
    proxy: string
    // Batch
    batchMode: boolean
    // Clipping
    isClipping: boolean
    rangeStart: string
    rangeEnd: string
    // GIF Options
    gifFps: number
    gifScale: number // Represents height (e.g. 480)
    gifQuality: 'high' | 'fast'

    // Post-Processing
    postProcessorArgs?: string
}

// Setters corresponding to DialogOptions (for Context or Prop Grouping)
export interface DialogOptionSetters {
    setFormat: (v: string) => void
    setContainer: (v: string) => void
    setPath: (v: string) => void
    setCustomFilename: (v: string) => void
    setAudioBitrate: (v: string) => void
    setAudioFormat: (v: string) => void
    setAudioNormalization: (v: boolean) => void
    setVideoCodec: (v: 'auto' | 'av1' | 'h264' | 'hevc' | 'vp9') => void
    setSponsorBlock: (v: boolean) => void
    setSplitChapters: (v: boolean) => void
    setSubtitles: (v: boolean) => void
    setSubtitleLang: (v: string) => void
    setSubtitleFormat: (v: string | undefined) => void
    setEmbedSubtitles: (v: boolean) => void
    setIsScheduled: (v: boolean) => void
    setScheduleTime: (v: string) => void
    setProxy: (v: string) => void
    setBatchMode: (v: boolean) => void
    setIsClipping: (v: boolean) => void
    setRangeStart: (v: string) => void
    setRangeEnd: (v: string) => void
    setGifFps: (v: number) => void
    setGifScale: (v: number) => void
    setGifQuality: (v: 'high' | 'fast') => void

    // Post-Processing
    setPostProcessorArgs: (v: string) => void
}

// --- Store & Shared Types ---

export interface DownloadOptions {
    path?: string // Save directory
    rangeStart?: string | number
    rangeEnd?: string | number
    format?: string
    container?: string
    sponsorBlock?: boolean
    liveFromStart?: boolean // Download livestream from the beginning
    splitChapters?: boolean // Split video into multiple files based on chapters
    customFilename?: string // User-defined filename (without extension)
    audioBitrate?: string // Audio quality in kbps (128, 192, 320)
    audioFormat?: 'mp3' | 'm4a' | 'flac' | 'wav' | 'opus' | 'aac' // Audio format for extraction
    subtitles?: boolean // Download subtitles
    subtitleFormat?: string // format to convert subtitles to (srt, ass, vtt, lrc)
    subtitleLang?: string // Subtitle language (en, id, auto, all)
    embedSubtitles?: boolean // Embed subtitles into video
    videoCodec?: 'auto' | 'av1' | 'h264' | 'vp9' | 'hevc' // Codec Preference
    scheduledTime?: number // Timestamp
    audioNormalization?: boolean // Loudness Normalization
    forceTranscode?: boolean // Force re-encoding if native codec unavailable
    cookies?: string // Netscape formatted cookies content (or path)
    userAgent?: string // Custom User Agent
    useAria2c?: boolean // Parabolic: Use external aria2c downloader
    // GIF Options
    gifFps?: number
    gifScale?: number
    gifQuality?: 'high' | 'fast'

    // Post-Processing (Custom FFmpeg args from preset)
    postProcessorArgs?: string
}


export interface SavedCredential {
    service: string
    username: string
}

export interface AppSettings {

    // General
    theme: 'dark' | 'light' | 'system'
    language: 'en' | 'id' | 'ms' | 'zh'
    launchAtStartup: boolean
    startMinimized: boolean
    closeAction: 'minimize' | 'quit'
    hasSeenOnboarding: boolean

    // Downloads
    downloadPath: string
    alwaysAskPath: boolean
    filenameTemplate: string
    resolution: string
    container: 'mp4' | 'mkv' | 'webm' | 'mov'
    hardwareDecoding: boolean; // Simplified to On/Off


    // Network
    concurrentDownloads: number
    speedLimit: string
    useAria2c: boolean
    proxy: string
    userAgent: string
    frontendFontSize: 'small' | 'medium' | 'large'
    // savedCredentials: string[] // List of "service|username" keys to track what is in the vault
    savedCredentials: SavedCredential[] // Structured storage for UI


    // Advanced
    cookieSource: 'none' | 'browser' | 'txt'
    browserType?: 'chrome' | 'edge' | 'firefox' | 'opera' | 'brave' | 'vivaldi' | 'chromium' | 'safari'
    cookiePath?: string
    useSponsorBlock: boolean
    sponsorSegments: string[]
    binaryPathYtDlp: string
    binaryPathFfmpeg: string
    embedMetadata: boolean
    embedThumbnail: boolean
    embedChapters: boolean // Embed chapter markers in video
    postDownloadAction: 'none' | 'sleep' | 'shutdown'
    developerMode: boolean
    audioNormalization: boolean // Loudness Normalization (EBU R128)
    historyRetentionDays: number // Days to keep completed tasks in history (-1 = forever, 0 = never)
    maxHistoryItems: number // Max number of completed tasks to keep (-1 = unlimited)

    useMetadataEnhancer: boolean
    useReplayGain: boolean
    usePoToken: boolean
    poToken: string
    visitorData: string
    useChromeCookieUnlock: boolean

    // Parabolic Features
    enableDesktopNotifications: boolean // Send desktop notifications when app is in background
    preventSuspendDuringDownload: boolean // Prevent system sleep during active downloads

    // Custom Post-Processor Presets (Feature 5)
    postProcessorPresets: PostProcessorPreset[] // User-defined FFmpeg argument presets
}

/**
 * Post-Processor Preset
 * Inspired by Parabolic's PostProcessorArgument
 * Allows users to define reusable FFmpeg argument presets
 */
export interface PostProcessorPreset {
    id: string
    name: string
    description?: string
    // Post-processor type (determines when args are applied)
    type: 'audio' | 'video' | 'metadata' | 'subtitles' | 'general'
    // FFmpeg arguments to apply
    args: string
    // Whether this preset is enabled by default for new downloads
    isDefault: boolean
}

export interface CompressionOptions {
    preset: 'wa' | 'social' | 'archive' | 'custom'
    crf: number
    resolution: string
    encoder: 'auto' | 'cpu' | 'nvenc' | 'amf' | 'qsv'
    speedPreset: 'ultrafast' | 'veryfast' | 'medium' | 'slow' | 'veryslow'
    audioBitrate?: string
}
