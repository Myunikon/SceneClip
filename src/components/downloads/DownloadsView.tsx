import { useAppStore } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { DownloadEmptyState } from './DownloadEmptyState'
import { DownloadItem } from './DownloadItem'
import { ErrorBoundary } from '../common/ErrorBoundary'

const ACTIVE_STATUSES = ['pending', 'fetching_info', 'downloading', 'paused', 'processing', 'error']

export function DownloadsView() {
  // Performance Optimization: Only re-render parent when task list composition changes.
  // Individual DownloadItem components subscribe to their own task updates.
  const taskIds = useAppStore(useShallow((s) =>
    s.tasks
      .filter(t => ACTIVE_STATUSES.includes(t.status))
      .map(t => t.id)
  ))

  if (taskIds.length === 0) {
    return <DownloadEmptyState />
  }

  return (
    <div className="w-full flex flex-col h-full bg-background/50">
      {/* 
         No Headers - Clean List Style (Safari Popover / Finder List) 
         The rows themselves handle the information hierarchy.
       */}

      {/* Scrollable List Body */}
      <div className="flex-1 overflow-y-auto pt-2">
        <ErrorBoundary fallback={<div className="p-4 text-center text-red-500">Failed to render list</div>}>
          <div className="flex flex-col">
            {taskIds.map(taskId => (
              <div key={taskId} className="content-visibility-auto">
                <DownloadItem taskId={taskId} />
              </div>
            ))}
          </div>
        </ErrorBoundary>
      </div>
    </div>
  )
}

