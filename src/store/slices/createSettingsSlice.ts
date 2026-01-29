import { StateCreator } from 'zustand'
import { AppState, SettingsSlice, AppSettings } from './types'

export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'light',
    language: 'en',
    launchAtStartup: false,
    startMinimized: false,
    closeAction: 'minimize',
    hasSeenOnboarding: false,

    downloadPath: '',
    alwaysAskPath: false,
    filenameTemplate: '{Title}',
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
    embedMetadata: true, // Default: ON
    embedThumbnail: true, // Default: ON
    embedChapters: false, // Default: OFF
    postDownloadAction: 'none', // Default: none
    developerMode: false, // Default: OFF
    audioNormalization: false, // Default: OFF
    savedCredentials: [],
    historyRetentionDays: 30, // Default: keep 30 days of history
    maxHistoryItems: 100, // Default: keep up to 100 completed tasks (-1 = unlimited)
    useSrtFixer: true, // Default: ON
    useMetadataEnhancer: true, // Default: ON
    useReplayGain: false, // Default: OFF (needs external tools like rsgain)
    usePoToken: true, // Default: ON (crucial for 403 bypass)
    poToken: '',
    visitorData: '',
    useChromeCookieUnlock: true, // Default: ON (Windows security bypass)

    enableDesktopNotifications: true, // Default: enabled
    preventSuspendDuringDownload: true, // Default: prevent sleep during downloads (ON)
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
