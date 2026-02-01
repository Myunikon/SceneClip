/**
 * Unified Notification System
 * Toast popup + logs to Notification Center (like Windows 11)
 */
import { toast as sonnerToast, ExternalToast } from 'sonner'
import { useAppStore } from '../store'
import { LogEntry } from '../store/slices/types'

// Get addLog function from store (non-hook version)
const addToNotificationCenter = (
    message: string,
    level: 'info' | 'success' | 'warning' | 'error' | 'debug' = 'info',
    source: 'system' | 'ytdlp' | 'ffmpeg' | 'ui' = 'system',
    logData?: Partial<LogEntry>
) => {
    useAppStore.getState().addLog({ message, level, source, ...logData } as Omit<LogEntry, 'id' | 'timestamp'>)
}

/**
 * Enhanced toast that shows popup AND saves to notification center
 */
export const notify = {
    success: (message: string, options?: ExternalToast, source: 'system' | 'ytdlp' | 'ffmpeg' | 'ui' = 'system', logData?: Record<string, unknown>) => {
        addToNotificationCenter(message, 'success', source, logData)
        return sonnerToast.success(message, options)
    },

    error: (message: string, options?: ExternalToast, source: 'system' | 'ytdlp' | 'ffmpeg' | 'ui' = 'system', logData?: Record<string, unknown>) => {
        addToNotificationCenter(message, 'error', source, logData)
        return sonnerToast.error(message, options)
    },

    warning: (message: string, options?: ExternalToast, source: 'system' | 'ytdlp' | 'ffmpeg' | 'ui' = 'system', logData?: Record<string, unknown>) => {
        addToNotificationCenter(message, 'warning', source, logData)
        return sonnerToast.warning(message, options)
    },

    info: (message: string, options?: ExternalToast, source: 'system' | 'ytdlp' | 'ffmpeg' | 'ui' = 'system', logData?: Record<string, unknown>) => {
        addToNotificationCenter(message, 'info', source, logData)
        return sonnerToast.info(message, options)
    },
    debug: (message: string, source: 'system' | 'ytdlp' | 'ffmpeg' | 'ui' = 'system', logData?: Record<string, unknown>) => {
        addToNotificationCenter(message, 'debug', source, logData)
        // No toast for debug usually, but we can add one if user wants. For now, just log.
        console.debug(message, logData)
    },

    // Standard toast (just popup, no notification center log)
    message: (message: string, options?: ExternalToast) => {
        return sonnerToast(message, options)
    }
}

// Default export for easy migration
export default notify
