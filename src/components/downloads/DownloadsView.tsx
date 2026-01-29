import { useAppStore } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { DownloadEmptyState } from './DownloadEmptyState'
import { DownloadItem } from './DownloadItem'

export function DownloadsView() {
  // Context7 Pattern: Select derived value (IDs) instead of raw array
  // This prevents re-renders when individual task data changes (only task additions/removals trigger re-render)
  // FIX: Only show active/error tasks. Completed/Stopped should "move" to History.
  const taskIds = useAppStore(useShallow((s) =>
    s.tasks
      .filter(t => !['completed', 'stopped'].includes(t.status))
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
        <div className="flex flex-col">
          {taskIds.map(taskId => (
            <DownloadItem key={taskId} taskId={taskId} />
          ))}
        </div>
      </div>
    </div>
  )
}

