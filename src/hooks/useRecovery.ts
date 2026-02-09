import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { toast } from 'sonner'

export function useRecovery() {
    const hasChecked = useRef(false)

    const {
        sanitizeTasks,
        getInterruptedCount,
        recoverDownloads,
        cleanupOldTasks,
        settings
    } = useAppStore()

    const mountedRef = useRef(true)
    useEffect(() => {
        return () => { mountedRef.current = false }
    }, [])

    // Fix: Use ref to track the latest recoverDownloads function to avoid stale closures in Toast callbacks
    const recoverDownloadsRef = useRef(recoverDownloads)
    useEffect(() => {
        recoverDownloadsRef.current = recoverDownloads
    }, [recoverDownloads])

    useEffect(() => {
        // Only run once on mount
        if (hasChecked.current) return
        hasChecked.current = true

        // Sanitize any stale task states
        sanitizeTasks()

        // Cleanup old completed/failed tasks based on retention policy
        cleanupOldTasks(settings.historyRetentionDays)

        // Check for interrupted downloads
        const interruptedCount = getInterruptedCount()
        if (interruptedCount > 0) {
            // Show recovery prompt
            toast.info(
                `${interruptedCount} download${interruptedCount > 1 ? 's were' : ' was'} interrupted`,
                {
                    description: 'Would you like to recover and restart them?',
                    duration: 10000, // 10 seconds
                    action: {
                        label: 'Recover',
                        onClick: () => {
                            if (!mountedRef.current) return
                            // Use ref to get latest function instance
                            const recovered = recoverDownloadsRef.current()
                            if (recovered > 0) {
                                toast.success(`Recovered ${recovered} download${recovered > 1 ? 's' : ''}`)
                            }
                        }
                    },
                    cancel: {
                        label: 'Dismiss',
                        onClick: () => {
                            if (!mountedRef.current) return
                            // User chose not to recover - we could optionally clear these
                            toast.info('Interrupted downloads kept in queue')
                        }
                    }
                }
            )
        }
    }, [sanitizeTasks, getInterruptedCount, cleanupOldTasks, settings.historyRetentionDays])
}
