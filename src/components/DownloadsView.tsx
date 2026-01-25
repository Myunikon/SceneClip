import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store'
import { DownloadEmptyState } from './downloads/DownloadEmptyState'
import { DownloadItem } from './downloads/DownloadItem'

export function DownloadsView() {
  const { tasks } = useAppStore()
  const { t } = useTranslation()

  // Only show active/in-progress tasks - completed/stopped go to History
  const displayTasks = tasks.filter(t => ['pending', 'fetching_info', 'downloading', 'error', 'paused'].includes(t.status))

  if (displayTasks.length === 0) {
    return <DownloadEmptyState />
  }

  return (
    <div className="w-full space-y-2">
      {/* Header (Desktop Only) */}
      <div className="hidden md:grid grid-cols-[3fr_100px_3fr_auto] gap-4 p-4 bg-secondary/50 text-secondary-foreground font-semibold text-sm rounded-lg mb-2">
        <div>{t('downloads.headers.title_url')}</div>
        <div>{t('downloads.headers.status')}</div>
        <div>{t('downloads.headers.progress')}</div>
        <div className="text-right">{t('downloads.headers.actions')}</div>
      </div>

      <div className="space-y-4 md:space-y-2">
        {displayTasks.map(task => (
          <DownloadItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
