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

    useEffect(() => {
        // Only run once on mount
        if (hasChecked.current) return
        hasChecked.current = true

        // First, sanitize any tasks that were running when app closed
        sanitizeTasks()

        // Cleanup old completed tasks based on retention setting
        // Default: 30 days if not set
        const retentionDays = settings.historyRetentionDays ?? 30
        if (retentionDays > 0) {
            cleanupOldTasks(retentionDays)
        }

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
                            const recovered = recoverDownloads()
                            if (recovered > 0) {
                                toast.success(`Recovered ${recovered} download${recovered > 1 ? 's' : ''}`)
                            }
                        }
                    },
                    cancel: {
                        label: 'Dismiss',
                        onClick: () => {
                            // User chose not to recover - we could optionally clear these
                            toast.info('Interrupted downloads kept in queue')
                        }
                    }
                }
            )
        }
    }, [sanitizeTasks, getInterruptedCount, recoverDownloads, cleanupOldTasks, settings.historyRetentionDays])
}
