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
    filenameTemplate: '{title}.{ext}',
    resolution: 'Best',
    container: 'mp4',
    hardwareDecoding: 'cpu',

    concurrentDownloads: 3,
    concurrentFragments: 4,
    speedLimit: '',
    proxy: '',
    userAgent: '',
    lowPerformanceMode: false,
    frontendFontSize: 'medium',


    cookieSource: 'none',
    browserType: 'chrome',
    useSponsorBlock: false,
    sponsorSegments: ['sponsor', 'intro', 'outro'],
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
    audioNormalization: false
}

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set) => ({
  settings: DEFAULT_SETTINGS,
  
  setSetting: (key, val) => {
      set(state => ({ settings: { ...state.settings, [key]: val } }))
  },
  updateSettings: (newSettings) => {
      set(state => ({ settings: { ...state.settings, ...newSettings } }))
  },
})
