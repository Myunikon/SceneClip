import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

class NotificationService {
    private static instance: NotificationService

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService()
        }
        return NotificationService.instance
    }

    public async notifyIfBackground(title: string, body: string, options?: { icon?: string, sound?: string }): Promise<boolean> {
        try {
            const appWindow = getCurrentWindow()
            const isFocused = await appWindow.isFocused()

            if (isFocused) {
                return false
            }

            // Call Rust to handle notification
            // Rust will use tauri-plugin-notification internally
            // Pass options if available
            await invoke('notify_background', { title, body, options })
            return true
        } catch (e) {
            console.warn('[NotificationService] Failed:', e)
            return false
        }
    }

    public async notifyDownloadComplete(title: string): Promise<boolean> {
        return this.notifyIfBackground(
            '✅ Download Complete',
            `${title} has finished downloading`,
        )
    }

    public async notifyDownloadFailed(title: string, error?: string): Promise<boolean> {
        return this.notifyIfBackground(
            '❌ Download Failed',
            `${title} failed${error ? `: ${error}` : ''}`,
        )
    }

    public async notifyBatchComplete(count: number): Promise<boolean> {
        return this.notifyIfBackground(
            '✅ All Downloads Complete',
            `${count} download${count > 1 ? 's have' : ' has'} finished`,
        )
    }
}

export const notificationService = NotificationService.getInstance()
export default NotificationService
