import { useAppStore } from '../../store'
import { cn } from '../../lib/utils'

interface TaskStatusMap {
    [key: string]: {
        en: string;
        id: string;
        ms: string;
        zh: string;
    };
}

export function StatusBadge({ status }: { status: string }) {
    const { settings } = useAppStore()

    const statusMap: TaskStatusMap = {
        pending: { en: 'Pending', id: 'Menunggu', ms: 'Menunggu', zh: '等待中' },
        fetching_info: { en: 'Fetching Info', id: 'Mengambil Info', ms: 'Mengambil Maklumat', zh: '获取信息' },
        downloading: { en: 'Downloading', id: 'Mengunduh', ms: 'Memuat Turun', zh: '下载中' },
        completed: { en: 'Completed', id: 'Selesai', ms: 'Selesai', zh: '完成' },
        error: { en: 'Error', id: 'Gagal', ms: 'Ralat', zh: '错误' },
        stopped: { en: 'Stopped', id: 'Berhenti', ms: 'Berhenti', zh: '停止' },
        paused: { en: 'Paused', id: 'Jeda', ms: 'Jeda', zh: '已暂停' }
    }

    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500',
        fetching_info: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500',
        downloading: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500',
        error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500',
        stopped: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
        paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500',
    }

    // Fallback logic
    const label = statusMap[status]?.[settings.language as keyof typeof statusMap['pending']] || statusMap[status]?.en || status;

    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", colors[status] || colors.stopped)}>
            {label}
        </span>
    )
}
