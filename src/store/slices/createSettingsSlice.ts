import { StateCreator } from 'zustand'
import { AppState, SettingsSlice, AppSettings } from './types'

export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'light',
    language: 'en',
    launchAtStartup: false,
    startMinimized: false,
    closeAction: 'quit',
    hasSeenOnboarding: false,

    downloadPath: '',
    alwaysAskPath: false,
    filenameTemplate: '{title}',
    resolution: 'Best',
    container: 'mp4',
    hardwareDecoding: false, // Default: OFF

    concurrentDownloads: 2, // Default: 2
    speedLimit: '',
    useAria2c: false, // Default: OFF
    proxy: '',
    userAgent: '',
    frontendFontSize: 'medium',

    cookieSource: 'none',
    browserType: 'chrome',
    cookiePath: '',
    useSponsorBlock: false, // Default: OFF
    sponsorSegments: ['sponsor', 'selfpromo', 'interaction'],
    binaryPathYtDlp: '',
    binaryPathFfmpeg: '',
    binaryPathFfprobe: '',
    binaryPathAria2c: '',
    binaryPathRsgain: '',
    binaryPathNode: '',
    embedMetadata: true, // Default: ON
    embedThumbnail: true, // Default: ON
    embedChapters: false, // Default: OFF
    embedSubtitles: false, // Default: OFF
    postDownloadAction: 'none', // Default: none
    developerMode: false, // Default: OFF
    audioNormalization: false, // Default: OFF
    savedCredentials: [],
    historyRetentionDays: 30, // Default: keep 30 days of history
    maxHistoryItems: 100, // Default: keep up to 100 completed tasks (-1 = unlimited)

    useMetadataEnhancer: false, // Default: OFF
    useSmartProxy: false, // Default: OFF
    useReplayGain: false, // Default: OFF
    usePoToken: false, // Default: OFF
    poToken: '',
    visitorData: '',
    useChromeCookieUnlock: false, // Default: OFF

    enableDesktopNotifications: true, // Default: enabled
    preventSuspendDuringDownload: true, // Default: prevent sleep during downloads (ON)
    removeSourceMetadata: false,
    enabledPresetIds: [],
    postProcessorPresets: [
        // Built-in presets
        {
            id: 'high-quality-audio',
            name: 'High Quality Audio',
            description: 'Extract audio at 320kbps',
            type: 'audio',
            args: '-acodec libmp3lame -ab 320k',
            isDefault: false
        },
        {
            id: 'compress-video',
            name: 'Compress Video',
            description: 'Reduce file size with CRF 28',
            type: 'video',
            args: '-crf 28 -preset fast',
            isDefault: false
        },
        {
            id: 'audio-boost',
            name: 'Audio Boost (1.5x)',
            description: 'Increase audio volume by 50%',
            type: 'audio',
            args: '-af volume=1.5',
            isDefault: false
        },
        {
            id: 'smart-normalize',
            name: 'Smart Normalize',
            description: 'EBU R128 loudness normalization',
            type: 'audio',
            args: '-af loudnorm=I=-16:TP=-1.5:LRA=11',
            isDefault: false
        }
    ]
}

export const createSettingsSlice: StateCreator<
    AppState,
    [["zustand/devtools", never]],
    [],
    SettingsSlice
> = (set) => ({
    settings: DEFAULT_SETTINGS,
    updateSettings: (newSettings) =>
        set((state) => ({
            settings: { ...state.settings, ...newSettings },
        })),
    setSetting: (key, val) =>
        set((state) => ({
            settings: { ...state.settings, [key]: val },
        })),
    resetSettings: () =>
        set(() => ({
            settings: DEFAULT_SETTINGS
        })),
})
