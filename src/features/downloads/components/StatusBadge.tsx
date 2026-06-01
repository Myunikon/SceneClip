import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'

export function StatusBadge({ status, className }: { status: string, className?: string }) {
    const { t } = useTranslation()

    // Map download statuses to design system Badge variants
    const statusVariantMap: Record<string, "warning" | "purple" | "info" | "success" | "destructive" | "secondary" | "paused"> = {
        pending: "warning",
        fetching_info: "purple",
        downloading: "info",
        completed: "success",
        error: "destructive",
        stopped: "secondary",
        paused: "paused",
    }

    const variant = statusVariantMap[status] || "secondary"
    const label = t(`task_status.${status}`)

    return (
        <Badge variant={variant} className={className}>
            {label}
        </Badge>
    )
}
