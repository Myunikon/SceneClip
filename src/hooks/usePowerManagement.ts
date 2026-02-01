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
            isInhibiting.current = true // Set early to prevent double invoke
            invoke('prevent_suspend', { prevent: true })
                .then(() => {
                    console.log('[PowerManagement] Preventing system suspend')
                })
                .catch((err) => {
                    isInhibiting.current = false
                    console.warn(err)
                })
        } else if (!hasActiveDownloads && isInhibiting.current) {
            // Stop inhibiting
            isInhibiting.current = false
            invoke('prevent_suspend', { prevent: false })
                .then(() => {
                    console.log('[PowerManagement] Allowing system suspend')
                })
                .catch((err) => {
                    isInhibiting.current = true
                    console.warn(err)
                })
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
