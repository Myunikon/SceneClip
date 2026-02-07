import { useState } from 'react'
import { Pause, Play, StopCircle, Trash2, FolderOpen, RefreshCcw, Terminal, FileVideo, FileAudio, FileImage, Copy, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, OverflowTooltip } from '../ui/tooltip'
import { openPath } from '@tauri-apps/plugin-opener'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { useTranslation } from 'react-i18next'
import { cn, formatRange } from '../../lib/utils'
import { useAppStore } from '../../store'
import { useShallow } from 'zustand/react/shallow'
import { CommandModal } from '../dialogs'
import { ConfirmDialog } from '../dialogs'
import { notify } from '../../lib/notify'
import { formatEtaHumanReadable } from '../../lib/formatters'

interface DownloadItemProps {
    taskId: string
}

export function DownloadItem({ taskId }: DownloadItemProps) {
    const { t } = useTranslation()

    // O(1) lookup optimization: Use tasksById instead of array.find()
    const task = useAppStore(useShallow((s) => s.tasksById[taskId]))
    const { pauseTask, stopTask, resumeTask, retryTask, clearTask, settings } = useAppStore(
        useShallow((s) => ({
            pauseTask: s.pauseTask,
            stopTask: s.stopTask,
            resumeTask: s.resumeTask,
            retryTask: s.retryTask,
            clearTask: s.clearTask,
            settings: s.settings
        }))
    )
    const [showCommandModal, setShowCommandModal] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [showClipPauseWarning, setShowClipPauseWarning] = useState(false)
    const [isCopying, setIsCopying] = useState(false)

    // Bail if task not found (deleted mid-render)
    if (!task) return null

    // Check if this is a clipped download (treat empty/null as Full)
    const isClipped = task.range && task.range !== 'Full'

    // --- Dynamic File Icon ---
    const getFileIcon = () => {
        const path = (task.filePath || task.url || '').toLowerCase()
        if (path.endsWith('.mp3') || path.endsWith('.m4a') || path.endsWith('.wav') || path.endsWith('.flac')) {
            return <FileAudio className="w-5 h-5" strokeWidth={1.5} />
        }
        if (path.endsWith('.gif') || path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.webp')) {
            return <FileImage className="w-5 h-5" strokeWidth={1.5} />
        }
        // Default to Video
        return <FileVideo className="w-5 h-5" strokeWidth={1.5} />
    }

    const handleCopyError = async () => {
        if (!task.log) return
        try {
            await writeText(task.log)
            setIsCopying(true)
            setTimeout(() => setIsCopying(false), 2000)
            notify.info(t('common.copied') || 'Copied to clipboard')
        } catch (e) {
            console.error('Failed to copy', e)
        }
    }

    // --- Semantic Status Formatter (Safari Style) ---
    const getStatusText = () => {
        if (task.status === 'downloading') {
            // "12.5 MB of 50 MB (2 MB/s) • 1 hour, 2 minutes and 30 seconds remaining"
            const sizeInfo = task.totalSize ? ` of ${task.totalSize}` : ''
            const speedInfo = task.speed ? `(${task.speed})` : ''
            // Use human-readable ETA if raw value is available
            let etaInfo = ''
            if (task.etaRaw && task.etaRaw > 0 && isFinite(task.etaRaw)) {
                etaInfo = ` • ${formatEtaHumanReadable(task.etaRaw, t)}`
            } else if (task.eta && task.eta !== '-') {
                etaInfo = ` • ${task.eta} remaining`
            }

            const progressDisplay = task.progress !== null ? task.progress.toFixed(0) : '...'
            return `${progressDisplay}%${sizeInfo} ${speedInfo}${etaInfo}`
        }
        if (task.status === 'paused') {
            const progressDisplay = task.progress !== null ? task.progress.toFixed(0) : '0'
            return `Paused • ${progressDisplay}% downloaded`
        }
        if (task.status === 'error') {
            // Rendered custom below
            return null
        }
        if (task.status === 'completed') {
            return `${task.totalSize || 'File'} • Download complete`
        }
        if (task.status === 'stopped') {
            return 'Cancelled'
        }
        return task.statusDetail || 'Waiting...'
    }

    const handleOpenFile = async () => {
        const target = task.filePath;
        if (target) {
            try {
                await openPath(target);
            } catch (e: unknown) {
                console.error('Failed to open file:', e);
                notify.error(t('errors.file_desc'), {
                    description: String(e)
                });
            }
        } else if (task.path) {
            handleOpenFolder();
        }
    }

    const handleOpenFolder = async () => {
        if (!task.path) return;
        try {
            await openPath(task.path);
        } catch {
            notify.error(t('errors.folder_not_found'));
        }
    }

    return (
        <>
            {/* Safari-like Row: Icon + Info Block + Actions */}
            <div className="group flex items-center gap-4 px-5 py-3 border-b border-border/40 bg-background/50 hover:bg-accent/40 transition-all duration-200 ease-out hover:scale-[1.002] hover:shadow-sm select-none">

                {/* 1. File Icon (Dynamic) */}
                <div className="shrink-0">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/50 text-muted-foreground",
                        task.status === 'error' && "bg-destructive/10 text-destructive",
                        task.status === 'completed' && "bg-blue-500/10 text-blue-500"
                    )}>
                        {getFileIcon()}
                    </div>
                </div>

                {/* 2. Unified Info Block */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                    {/* Title */}
                    <div className="flex items-center gap-2 min-w-0">
                        <OverflowTooltip
                            content={task.title || t('downloads.fetching_info')}
                            className={cn(
                                "font-medium text-[13px] text-foreground/90",
                                task.status === 'completed' && "cursor-pointer"
                            )}
                            onClick={task.status === 'completed' ? handleOpenFile : undefined}
                        >
                            {task.title || t('downloads.fetching_info')}
                        </OverflowTooltip>
                        {isClipped && (
                            <span className="text-[10px] font-medium bg-amber-500/10 text-amber-600 px-1.5 py-px rounded-[4px] border border-amber-500/10">
                                Clip: {formatRange(task.range || '')}
                            </span>
                        )}
                    </div>

                    {/* Progress Bar (Always visible if active or error) */}
                    {['downloading', 'paused', 'pending', 'fetching_info', 'processing', 'error'].includes(task.status) && (
                        <div className="h-1 bg-secondary/80 w-full rounded-full overflow-hidden">
                            {/* Indeterminate shimmer for processing or null progress */}
                            {(task.status === 'processing' || (task.progress === null && task.status !== 'error')) ? (
                                <div
                                    className="h-full w-full bg-gradient-to-r from-transparent via-blue-500/60 to-transparent animate-shimmer"
                                    style={{ backgroundSize: '200% 100%' }}
                                />
                            ) : (
                                <div
                                    className={cn(
                                        "h-full transition-all duration-300",
                                        task.status === 'paused' ? "bg-yellow-500" :
                                            task.status === 'error' ? "bg-destructive/50" : "bg-blue-500"
                                    )}
                                    style={{ width: `${Math.min(100, Math.max(0, task.progress ?? 0))}%` }}
                                />
                            )}
                        </div>
                    )}

                    {/* Status Text (Unified Line) */}
                    <div className={cn(
                        "text-[11px] font-medium",
                        task.status === 'error' ? "text-destructive" : "text-muted-foreground/70 truncate"
                    )}>
                        {task.status === 'error' ? (
                            <div className="flex items-start gap-2 max-w-full">
                                <span className="flex-1 select-text cursor-text break-words whitespace-normal leading-relaxed hover:text-destructive/90">
                                    {task.log || 'Download failed'}
                                </span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleCopyError()
                                            }}
                                            className="shrink-0 p-1 hover:bg-destructive/10 rounded-md transition-colors text-destructive/70 hover:text-destructive"
                                        >
                                            {isCopying ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('common.copy_error') || "Copy Error"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            getStatusText()
                        )}
                    </div>
                </div>

                {/* 3. Actions (Simplified Hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Only show primary action + 'More' for others eventually, or minimal set */}

                    {task.status === 'downloading' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => isClipped ? setShowClipPauseWarning(true) : pauseTask(task.id)} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-foreground/80">
                                    <Pause className="w-4 h-4 fill-current" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('common.pause') || 'Pause'}</p></TooltipContent>
                        </Tooltip>
                    )}
                    {task.status === 'paused' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => resumeTask(task.id)} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-foreground/80">
                                    <Play className="w-4 h-4 fill-current" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('common.resume') || 'Resume'}</p></TooltipContent>
                        </Tooltip>
                    )}

                    {['downloading', 'paused'].includes(task.status) && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => setShowCancelConfirm(true)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive">
                                    <StopCircle className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('common.cancel') || 'Cancel'}</p></TooltipContent>
                        </Tooltip>
                    )}

                    {task.status === 'completed' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={handleOpenFolder} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-blue-500">
                                    <FolderOpen className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('common.open_folder') || 'Open Folder'}</p></TooltipContent>
                        </Tooltip>
                    )}

                    {['error', 'stopped'].includes(task.status) && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => retryTask(task.id)} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-foreground/80">
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('common.retry') || 'Retry'}</p></TooltipContent>
                        </Tooltip>
                    )}

                    {/* Clear/Delete (Always available for inactive) */}
                    {['completed', 'error', 'stopped', 'pending'].includes(task.status) && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => clearTask(task.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('common.remove') || 'Remove'}</p></TooltipContent>
                        </Tooltip>
                    )}

                    {/* Logs - Strictly for Developer Mode */}
                    {settings.developerMode && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => setShowCommandModal(true)} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground">
                                    <Terminal className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('common.logs') || 'View Logs'}</p></TooltipContent>
                        </Tooltip>
                    )}
                </div>

            </div>

            {/* Dialogs */}
            <ConfirmDialog
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={() => stopTask(task.id)}
                title={t('downloads.cancel_confirm_title') || 'Cancel Download?'}
                description={t('downloads.cancel_confirm_desc') || 'This will stop the download.'}
                confirmLabel={t('downloads.confirm') || 'Yes, Cancel'}
                cancelLabel={t('downloads.keep_downloading') || 'Keep Downloading'}
            />
            <ConfirmDialog
                isOpen={showClipPauseWarning}
                onClose={() => setShowClipPauseWarning(false)}
                onConfirm={() => {
                    setShowClipPauseWarning(false)
                    pauseTask(task.id)
                }}
                title={t('downloads.clip_pause_title') || "Pause Clipped Download?"}
                description={`${t('downloads.clip_pause_desc')} (${task.range})`}
                confirmLabel={t('downloads.clip_pause_confirm')}
                cancelLabel={t('downloads.keep_downloading')}
            />
            <CommandModal
                task={task}
                isOpen={showCommandModal}
                onClose={() => setShowCommandModal(false)}
            />
        </>
    )
}
