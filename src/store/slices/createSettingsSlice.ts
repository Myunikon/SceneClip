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
    concurrentFragments: 4,
    speedLimit: '',
    proxy: '',
    userAgent: '',
    frontendFontSize: 'medium',

    cookieSource: 'none',
    browserType: 'chrome',
    cookiePath: '',
    useSponsorBlock: false,
    sponsorSegments: [],
    binaryPathYtDlp: '',
    binaryPathFfmpeg: '',
    embedMetadata: true,
    embedThumbnail: true,
    embedChapters: true,
    postDownloadAction: 'none',
    developerMode: false,
    quickDownloadEnabled: false,
    showQuickModeButton: true,
    lastDownloadOptions: null,
    audioNormalization: false,
    disablePlayButton: false
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
