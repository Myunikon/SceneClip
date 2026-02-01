
export type { DownloadOptions, AppSettings, CompressionOptions } from '../../types'
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
  progress: number | null // null = indeterminate (processing/merging)
  speed: string
  eta: string
  etaRaw?: number   // Raw seconds for human-readable formatting in UI
  speedRaw?: number // Raw bytes/sec for calculations
  totalSize?: string // e.g. "123.45MiB"
  range?: string
  format?: string
  log?: string
  path?: string // Save folder
  filePath?: string // Full path to file
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
  chapters?: VideoChapter[] // Store chapters for sequential splitting
  audioNormalization?: boolean // Persisted for UI indicator (Loudness Normalization applied)
  retryCount?: number // Auto-retry counter for transient network errors (max 3)
  options?: DownloadOptions // Mapping from Backend 'options'
}



export interface UISlice {
  showBinaryConfirmation: boolean
  missingBinaries: string[]
  requestBinaryConfirmation: (missing: string[]) => Promise<boolean>
  respondBinaryConfirmation: (answer: boolean) => void
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'success' | 'warning' | 'error'

export interface LogEntry {
  id: string // Unique ID for diffing
  message?: string // Fallback or raw message
  translationKey?: string
  params?: Record<string, string | number>
  level: LogLevel
  source: 'system' | 'ytdlp' | 'ffmpeg' | 'ui'
  context?: string // Additional context (user action, file path, etc)
  stackTrace?: string // For errors
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
  setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
  updateSettings: (newSettings: Partial<AppSettings>) => void
  resetSettings: () => void
}

export interface SystemSlice {
  binariesReady: boolean
  listenersInitialized: boolean
  hasNotifiedMissingBinaries: boolean // Track if we've alerted user
  gpuType: 'cpu' | 'nvidia' | 'amd' | 'intel' | 'apple'
  gpuModel?: string
  gpuRenderer?: string

  // App Version Tracking (SceneClip)
  appVersion: string | null
  appLatestVersion: string | null
  appNeedsUpdate: boolean
  appUpdateError?: string

  // yt-dlp Version Tracking
  ytdlpVersion: string | null
  ytdlpLatestVersion: string | null
  ytdlpNeedsUpdate: boolean
  ytdlpIntegrityValid: boolean
  ytdlpUpdateError?: string

  // FFmpeg Version Tracking
  ffmpegVersion: string | null
  ffmpegLatestVersion: string | null
  ffmpegNeedsUpdate: boolean
  ffmpegIntegrityValid: boolean

  // Progress Tracking
  ytdlpUpdateProgress: number | null
  ffmpegUpdateProgress: number | null
  appUpdateProgress: number | null
  isCheckingUpdates: boolean
  isCheckingAppUpdate: boolean
  isCheckingYtdlpUpdate: boolean

  setBinariesReady: (ready: boolean) => void

  detectHardwareAccel: () => Promise<void>
  initListeners: () => void
  checkBinaryUpdates: (scope?: 'app' | 'binaries' | 'all') => Promise<void>
  updateBinary: (name: 'yt-dlp') => Promise<void> // Perform the update
  installAppUpdate: () => Promise<void>
  cancelUpdate: (name: string) => Promise<void>
  validateBinaries: () => Promise<void>
}


export interface VideoSlice {
  tasks: DownloadTask[]
  initializeQueue: () => Promise<void>
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
  recoverDownloads: () => number  // Returns count of recovered tasks
  retryAllFailed: () => void      // Retry all failed/stopped tasks
  getInterruptedCount: () => number // Count tasks that can be recovered
  cleanupOldTasks: (retentionDays: number) => void // Remove old completed tasks
}

export type AppState = UISlice & LogSlice & SettingsSlice & SystemSlice & VideoSlice
