export interface DownloadOptions {
  path?: string // Save directory
  rangeStart?: string | number
  rangeEnd?: string | number
  format?: string
  container?: string
  sponsorBlock?: boolean
  turbo?: boolean
}

export interface DownloadTask {
  id: string
  url: string
  title: string
  status: 'pending' | 'fetching_info' | 'downloading' | 'completed' | 'error' | 'stopped' | 'paused'
  progress: number
  speed: string
  eta: string
  range?: string
  format?: string
  log?: string
  path?: string // Save folder
  filePath?: string // Full path to file
  _options?: DownloadOptions
  // Developer Mode: Command details
  ytdlpCommand?: string
  ffmpegCommand?: string
}


export interface AppSettings {
  // General
  theme: 'dark' | 'light'
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
  container: 'mp4' | 'mkv'


  // Network
  concurrentDownloads: number
  concurrentFragments: number // yt-dlp -N argument
  speedLimit: string
  proxy: string
  userAgent: string
  lowPerformanceMode: boolean
  
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
  postDownloadAction: 'none' | 'sleep' | 'shutdown'
  developerMode: boolean
}

export interface UISlice {
  showBinaryConfirmation: boolean
  missingBinaries: string[]
  requestBinaryConfirmation: (missing: string[]) => Promise<boolean>
  respondBinaryConfirmation: (answer: boolean) => void
}

export interface LogEntry {
  message: string
  timestamp: number
}

export interface LogSlice {
  logs: LogEntry[]
  addLog: (msg: string) => void
  clearLogs: () => void
}

export interface SettingsSlice {
  settings: AppSettings
  setSetting: (key: string, val: any) => void
  updateSettings: (newSettings: Partial<AppSettings>) => void
}

export interface SystemSlice {
  binariesReady: boolean
  listenersInitialized: boolean
  hasNotifiedMissingBinaries: boolean // Track if we've alerted user
  gpuType: 'cpu' | 'nvidia'
  
  // yt-dlp Version Tracking
  ytdlpVersion: string | null
  ytdlpLatestVersion: string | null
  ytdlpNeedsUpdate: boolean
  ytdlpUpdateUrgency: 'none' | 'optional' | 'critical'  // Version policy urgency
  
  setBinariesReady: (ready: boolean) => void
  
  detectHardwareAccel: () => Promise<void>
  initListeners: () => void
  checkYtDlpUpdate: () => Promise<void>
  updateYtDlp: () => Promise<void>
  validateBinaries: () => Promise<void>
}

export interface VideoSlice {
  tasks: DownloadTask[]
  addTask: (url: string, options: DownloadOptions) => Promise<void>
  stopTask: (id: string) => Promise<void>
  pauseTask: (id: string) => Promise<void>
  resumeTask: (id: string) => Promise<void>
  retryTask: (id: string) => Promise<void>
  clearTask: (id: string) => void
  deleteHistory: () => void
  updateTask: (id: string, updates: Partial<DownloadTask>) => void
  startTask: (id: string) => Promise<void>
  processQueue: () => void
}

export type AppState = UISlice & LogSlice & SettingsSlice & SystemSlice & VideoSlice
