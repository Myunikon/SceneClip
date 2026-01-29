/**
 * Unified Notification System
 * Toast popup + logs to Notification Center (like Windows 11)
 */
import { toast as sonnerToast, ExternalToast } from 'sonner'
import { useAppStore } from '../store'

// Get addLog function from store (non-hook version)
const addToNotificationCenter = (
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    source: 'system' | 'ytdlp' | 'ffmpeg' = 'system',
    logData?: Record<string, unknown>
) => {
    useAppStore.getState().addLog({ message, type, source, ...logData })
}

/**
 * Enhanced toast that shows popup AND saves to notification center
 */
export const notify = {
    success: (message: string, options?: ExternalToast, source: 'system' | 'ytdlp' | 'ffmpeg' = 'system', logData?: Record<string, unknown>) => {
        addToNotificationCenter(message, 'success', source, logData)
        return sonnerToast.success(message, options)
    },

    error: (message: string, options?: ExternalToast, source: 'system' | 'ytdlp' | 'ffmpeg' = 'system', logData?: Record<string, unknown>) => {
        addToNotificationCenter(message, 'error', source, logData)
        return sonnerToast.error(message, options)
    },

    warning: (message: string, options?: ExternalToast, source: 'system' | 'ytdlp' | 'ffmpeg' = 'system', logData?: Record<string, unknown>) => {
        addToNotificationCenter(message, 'warning', source, logData)
        return sonnerToast.warning(message, options)
    },

    info: (message: string, options?: ExternalToast, source: 'system' | 'ytdlp' | 'ffmpeg' = 'system', logData?: Record<string, unknown>) => {
        addToNotificationCenter(message, 'info', source, logData)
        return sonnerToast.info(message, options)
    },

    // Standard toast (just popup, no notification center log)
    message: (message: string, options?: ExternalToast) => {
        return sonnerToast(message, options)
    }
}

// Default export for easy migration
export default notify
