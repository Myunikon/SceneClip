import { StateCreator } from 'zustand'
import { AppState, SettingsSlice, AppSettings } from './types'

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
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
    hardwareDecoding: true,

    concurrentDownloads: 2,
    speedLimit: '',
    useAria2c: false,
    proxy: '',
    userAgent: '',
    frontendFontSize: 'medium',

    cookieSource: 'none',
    browserType: 'chrome',
    cookiePath: '',
    useSponsorBlock: false,
    sponsorSegments: ['sponsor', 'selfpromo', 'interaction'],
    binaryPathYtDlp: '',
    binaryPathFfmpeg: '',
    embedMetadata: true,
    embedThumbnail: true,
    embedChapters: true,
    postDownloadAction: 'none',
    developerMode: false,
    audioNormalization: false,
    savedCredentials: [],
    historyRetentionDays: 30, // Default: keep 30 days of history
    maxHistoryItems: 100, // Default: keep up to 100 completed tasks (-1 = unlimited)

    // Parabolic Features
    enableDesktopNotifications: true, // Default: enabled
    preventSuspendDuringDownload: true, // Default: prevent sleep during downloads
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
