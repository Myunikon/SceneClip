/**
 * Notification Service - Desktop Notifications
 * 
 * Inspired by Parabolic's ShellNotification
 * Sends native desktop notifications when app is in background
 * 
 * @see Context7: @tauri-apps/plugin-notification
 */

import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from '@tauri-apps/plugin-notification'
import { getCurrentWindow } from '@tauri-apps/api/window'

class NotificationService {
    private static instance: NotificationService
    private permissionGranted: boolean = false
    private initialized: boolean = false

    private constructor() { }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService()
        }
        return NotificationService.instance
    }

    /**
     * Initialize and check permissions
     */
    public async init(): Promise<void> {
        if (this.initialized) return

        try {
            this.permissionGranted = await isPermissionGranted()

            if (!this.permissionGranted) {
                const permission = await requestPermission()
                this.permissionGranted = permission === 'granted'
            }

            this.initialized = true
        } catch (e) {
            console.warn('[NotificationService] Failed to initialize:', e)
            this.initialized = true // Mark as init to avoid repeated failures
        }
    }

    /**
     * Send a notification only if the app window is not focused
     */
    public async notifyIfBackground(
        title: string,
        body: string,
        options?: {
            icon?: string
            sound?: string
        }
    ): Promise<boolean> {
        try {
            // Check if window is focused
            const appWindow = getCurrentWindow()
            const isFocused = await appWindow.isFocused()

            // Only send if in background
            if (isFocused) {
                return false
            }

            if (!this.permissionGranted) {
                await this.init()
            }

            if (this.permissionGranted) {
                await sendNotification({
                    title,
                    body,
                    icon: options?.icon,
                    sound: options?.sound,
                })
                return true
            }

            return false
        } catch (e) {
            console.warn('[NotificationService] Failed to send notification:', e)
            return false
        }
    }

    /**
     * Send download complete notification
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async notifyDownloadComplete(title: string, _filePath?: string): Promise<boolean> {
        return this.notifyIfBackground(
            '✅ Download Complete',
            `${title} has finished downloading`,
        )
    }

    /**
     * Send download failed notification
     */
    public async notifyDownloadFailed(title: string, error?: string): Promise<boolean> {
        return this.notifyIfBackground(
            '❌ Download Failed',
            `${title} failed${error ? `: ${error}` : ''}`,
        )
    }

    /**
     * Send batch complete notification
     */
    public async notifyBatchComplete(count: number): Promise<boolean> {
        return this.notifyIfBackground(
            '✅ All Downloads Complete',
            `${count} download${count > 1 ? 's have' : ' has'} finished`,
        )
    }
}

export const notificationService = NotificationService.getInstance()
export default NotificationService
