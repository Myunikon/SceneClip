/**
 * Power Management Hook
 * 
 * Inspired by Parabolic's SuspendInhibitor
 * Automatically prevents system sleep when downloads are active
 */

import { useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '../store'

export function usePowerManagement() {
    const isInhibiting = useRef(false)
    const { tasks, settings } = useAppStore()

    useEffect(() => {
        if (!settings.preventSuspendDuringDownload) {
            // Setting disabled - ensure we're not inhibiting
            if (isInhibiting.current) {
                invoke('prevent_suspend', { prevent: false }).catch(console.warn)
                isInhibiting.current = false
            }
            return
        }

        // Check if any downloads are active
        const hasActiveDownloads = tasks.some(t =>
            t.status === 'downloading' ||
            t.status === 'fetching_info' ||
            t.status === 'pending' ||
            t.status === 'processing'
        )

        if (hasActiveDownloads && !isInhibiting.current) {
            // Start inhibiting
            invoke('prevent_suspend', { prevent: true })
                .then(() => {
                    isInhibiting.current = true
                    console.log('[PowerManagement] Preventing system suspend')
                })
                .catch(console.warn)
        } else if (!hasActiveDownloads && isInhibiting.current) {
            // Stop inhibiting
            invoke('prevent_suspend', { prevent: false })
                .then(() => {
                    isInhibiting.current = false
                    console.log('[PowerManagement] Allowing system suspend')
                })
                .catch(console.warn)
        }
    }, [tasks, settings.preventSuspendDuringDownload])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isInhibiting.current) {
                invoke('prevent_suspend', { prevent: false }).catch(console.warn)
            }
        }
    }, [])
}
