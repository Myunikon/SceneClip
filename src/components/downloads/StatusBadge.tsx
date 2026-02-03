import { cn } from '../../lib/utils'
import { useTranslation } from 'react-i18next'

export function StatusBadge({ status, className }: { status: string, className?: string }) {
    const { t } = useTranslation()

    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500',
        fetching_info: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500',
        downloading: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500',
        error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500',
        stopped: 'bg-secondary text-secondary-foreground border border-border/50',
        paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500',
    }

    const getStatusColor = (s: string) => {
        if (s in colors) return colors[s]

        // Dev warning for unknown status
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[StatusBadge] Unknown status: "${s}"`)
        }
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border border-red-500/50'
    }

    // Use task_status namespace
    const label = t(`task_status.${status}`)

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap",
            getStatusColor(status),
            className
        )}>
            {label}
        </span>
    )
}
