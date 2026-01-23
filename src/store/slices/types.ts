
export type { DownloadOptions, AppSettings, CompressionOptions } from '../../types'
// Explicitly re-export interfaces if import type isn't sufficient for some tooling (though above should work)
// But wait, the previous errors said 'DownloadOptions' not found in store/slices/types.ts file itself?
// Ah, because I'm using them in the interfaces below.
import { DownloadOptions, AppSettings, CompressionOptions } from '../../types'

export type DownloadStatus = 'pending' | 'queued' | 'fetching_info' | 'downloading' | 'completed' | 'error' | 'stopped' | 'paused' | 'scheduled' | 'processing'

export interface VideoChapter {
  start_time: number
  end_time: number
  title: string
}

export interface DownloadTask {
  id: string
  pid?: number // Process ID for robust killing
  url: string
  title: string
  status: DownloadStatus
  statusDetail?: string // Granular status: "Merging...", "Extracting Audio...", "Fixing..."
  progress: number
  speed: string
  eta: string
  totalSize?: string // e.g. "123.45MiB"
  range?: string
  format?: string
  log?: string
  path?: string // Save folder
  filePath?: string // Full path to file
  concurrentFragments?: number // Number of parallel chunks used
  scheduledTime?: number // Timestamp for scheduled start
  addedAt?: number // Timestamp when added
  _options?: DownloadOptions
  _downloadPhase?: number // Internal: Track multi-phase download progress (video=1, audio=2)
  // Developer Mode: Command details
  ytdlpCommand?: string
  ffmpegCommand?: string
  // History Metadata
  fileSize?: string
  completedAt?: number
  chapters?: any[] // Store chapters for sequential splitting
  audioNormalization?: boolean // Persisted for UI indicator (Loudness Normalization applied)
}



export interface UISlice {
  showBinaryConfirmation: boolean
  missingBinaries: string[]
  requestBinaryConfirmation: (missing: string[]) => Promise<boolean>
  respondBinaryConfirmation: (answer: boolean) => void
}

export interface LogEntry {
  id: string // Unique ID for diffing
  message?: string // Fallback or raw message
  translationKey?: string
  params?: Record<string, string | number>
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
}

export interface LogSlice {
  logs: LogEntry[]
  addLog: (entry: Omit<LogEntry, 'timestamp' | 'id'>) => void
  clearLogs: () => void
  removeLog: (index: number) => void
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
  gpuType: 'cpu' | 'nvidia' | 'amd' | 'intel'
  gpuModel?: string
  gpuRenderer?: string

  // yt-dlp Version Tracking
  ytdlpVersion: string | null
  ytdlpLatestVersion: string | null
  ytdlpNeedsUpdate: boolean

  // FFmpeg Version Tracking
  ffmpegVersion: string | null
  ffmpegLatestVersion: string | null
  ffmpegNeedsUpdate: boolean

  // Loading state for version check
  isCheckingUpdates: boolean

  setBinariesReady: (ready: boolean) => void

  detectHardwareAccel: () => Promise<void>
  initListeners: () => void
  checkBinaryUpdates: () => Promise<void> // Check for updates (replaces checkYtDlpUpdate + updateYtDlp)
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
  importTasks: (tasks: DownloadTask[]) => void
  compressTask: (taskId: string, options: CompressionOptions) => Promise<void>
  sanitizeTasks: () => void
}

export type AppState = UISlice & LogSlice & SettingsSlice & SystemSlice & VideoSlice
