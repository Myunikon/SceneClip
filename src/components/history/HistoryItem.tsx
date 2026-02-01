import { memo } from 'react'
import { DownloadTask } from '../../store'
import {
    FileVideo, Music, FolderOpen, Play,
    Trash2, RefreshCw, Terminal,
    ExternalLink, FileUp, Minimize2
} from 'lucide-react'
import { cn, formatRange } from '../../lib/utils'
import youtubeIcon from '../../assets/platforms/youtube.png'
import instagramIcon from '../../assets/platforms/instagram.png'
import tiktokIcon from '../../assets/platforms/tiktok.png'
import facebookIcon from '../../assets/platforms/facebook.png'
import xIcon from '../../assets/platforms/x.png'
import { Globe } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, OverflowTooltip } from '../ui/tooltip'
import { open as openUrl } from '@tauri-apps/plugin-shell'
import { getProxiedSrc } from '../../lib/image-proxy'

// Helper for source icon
const getSourceInfo = (url: string) => {
    try {
        const hostname = new URL(url).hostname.replace('www.', '')
        if (hostname.includes('youtube') || hostname.includes('youtu.be')) return { icon: youtubeIcon, isImage: true, name: 'YouTube', color: 'text-red-600 dark:text-red-400' }
        if (hostname.includes('tiktok')) return { icon: tiktokIcon, isImage: true, name: 'TikTok', color: 'text-red-500 dark:text-red-400' }
        if (hostname.includes('instagram')) return { icon: instagramIcon, isImage: true, name: 'Instagram', color: 'text-orange-600 dark:text-orange-400' }
        if (hostname.includes('twitter') || hostname.includes('x.com')) return { icon: xIcon, isImage: true, name: 'X', color: 'text-orange-500 dark:text-orange-400' }
        if (hostname.includes('facebook') || hostname.includes('fb.watch')) return { icon: facebookIcon, isImage: true, name: 'Facebook', color: 'text-red-600 dark:text-red-400' }
        return { icon: Globe, isImage: false, name: hostname.split('.')[0], color: 'text-gray-500 dark:text-gray-400' }
    } catch { return { icon: Globe, isImage: false, name: 'Web', color: 'text-gray-500 dark:text-gray-400' } }
}

export interface HistoryItemProps {
    task: DownloadTask
    isSelected: boolean
    isSelectionMode: boolean
    isMissing?: boolean
    onToggleSelect: (id: string) => void
    onPlay: (path: string) => void
    onOpenFolder: (path: string) => void
    onRemove: (id: string) => void
    onRetry: (id: string) => void
    onCompress: (task: DownloadTask) => void
    onViewCommand: (task: DownloadTask) => void
    index: number
    language: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any
    developerMode?: boolean
}

export const HistoryItem = memo(({
    task,
    isSelected,
    isSelectionMode,
    isMissing,
    onToggleSelect,
    onPlay,
    onOpenFolder,
    onRemove,
    onRetry,
    onCompress,
    onViewCommand,
    index,
    language,
    t,
    developerMode
}: HistoryItemProps) => {
    const source = getSourceInfo(task.url)
    const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }) : null

    const isAudio = task.format?.toLowerCase().includes('audio') || task.url.toLowerCase().includes('audio')

    return (
        <div
            style={{ animationDelay: `${index * 30}ms` }}
            // Removed mx-2, my-1, rounded-xl to make it flat. Added hover:bg-secondary/50 for row effect.
            // Removed border except transparent to keep size stable.
            className={cn(
                "group relative flex items-center gap-4 px-6 py-3 transition-colors duration-200 hover:bg-secondary/30 animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards cursor-default select-none",
                // Removed bg-primary/5 for selection
                isSelected && "",
                isMissing && "opacity-70 grayscale-[0.5]"
            )}
            onClick={() => isSelectionMode && onToggleSelect(task.id)}
        >
            {/* 1. Leading Icon (Compact) */}
            <div className="shrink-0 relative group/icon">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm transition-transform group-hover/icon:scale-105",
                    isAudio
                        ? "bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/10"
                        : "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/10"
                )}>
                    {isAudio
                        ? <Music className="w-5 h-5 text-pink-500" />
                        : <FileVideo className="w-5 h-5 text-blue-500" />
                    }
                </div>
                {/* Micro Badge */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background shadow-sm flex items-center justify-center border border-border overflow-hidden">
                    {source.isImage ? (
                        <img src={getProxiedSrc(source.icon as string)} alt={source.name} className="w-full h-full object-cover" />
                    ) : (
                        <source.icon className="w-2.5 h-2.5 text-muted-foreground" />
                    )}
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                {/* Title */}
                <OverflowTooltip
                    content={task.title}
                    className={cn(
                        "font-medium text-[13.5px] leading-tight text-foreground",
                        isMissing && "decoration-red-500/50 line-through decoration-2"
                    )}
                >
                    {task.title || t('history.untitled') || "Untitled"}
                </OverflowTooltip>

                {/* Subtitle / Meta Line */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70 truncate">
                    <span className="shrink-0">{task.fileSize || task.totalSize || t('history.unknown_size') || "Unknown size"}</span>

                    {completedDate && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/20 shrink-0" />
                            <span className="shrink-0">{completedDate}</span>
                        </>
                    )}

                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20 shrink-0" />

                    {/* Tech Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="uppercase font-bold tracking-tight text-foreground/80">{task.format || "UNK"}</span>
                        {task._options?.videoCodec && (
                            <span className={cn(
                                "uppercase font-mono text-[9px] px-1 rounded bg-secondary/50",
                                task._options.videoCodec.includes('av1') ? "text-green-600 dark:text-green-400 font-bold" : "opacity-60"
                            )}>
                                {task._options.videoCodec.split('.')[0]}
                            </span>
                        )}
                    </div>

                    {/* Range Badge */}
                    {task.range && task.range !== 'Full' && (
                        <>
                            <span className="w-px h-2.5 bg-border shrink-0 mx-0.5" />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-purple-500 font-medium flex items-center gap-0.5">
                                        <Minimize2 className="w-3 h-3" />
                                        {formatRange(task.range)}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Clipped Video</p>
                                </TooltipContent>
                            </Tooltip>
                        </>
                    )}

                    {/* Path */}
                    {task.path && (
                        <>
                            <span className="w-px h-3 bg-border shrink-0 mx-1" />
                            <div className="flex items-center gap-1 min-w-0 opacity-40 hover:opacity-100 transition-opacity">
                                <FolderOpen className="w-3 h-3 shrink-0" />
                                <OverflowTooltip
                                    content={<p className="max-w-[500px] break-all font-mono text-[10px]">{task.path}</p>}
                                    className="truncate flex-1 font-mono text-[10px]"
                                >
                                    {task.path}
                                </OverflowTooltip>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 3. ACTIONS ROW (Pushed Right) */}
            <div className={cn(
                "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200",
                isSelectionMode ? "hidden" : "flex"
            )}>
                {/* Source Link */}
                <IconButton
                    onClick={() => openUrl(task.url)}
                    icon={ExternalLink}
                    title={t('history.open_url', { source: source.name }) || `Open ${source.name}`}
                    color="neutral"
                />

                {/* Developer Command */}
                {developerMode && (
                    <IconButton onClick={() => onViewCommand(task)} icon={Terminal} title={t('history.view_command') || "View Command"} color="neutral" />
                )}

                {/* Folder */}
                <IconButton onClick={() => task.path && onOpenFolder(task.path)} icon={FolderOpen} title={t('history.folder') || "Show in Folder"} color="neutral" />

                {/* Compress / Export */}
                <IconButton onClick={() => onCompress(task)} icon={FileUp} title={t('history.compress') || "Export"} color="orange" />

                {/* Play / Redownload */}
                {isMissing ? (
                    <IconButton onClick={() => onRetry(task.id)} icon={RefreshCw} title={t('history.redownload') || "Redownload"} color="neutral" />
                ) : (
                    <IconButton onClick={() => task.filePath && onPlay(task.filePath)} icon={Play} title={t('history.play') || "Play"} color="neutral" />
                )}

                {/* Delete */}
                <IconButton onClick={() => onRemove(task.id)} icon={Trash2} title={t('history.delete') || "Delete"} color="danger" />
            </div>

            {/* 4. Selection Checkbox (MOVED TO RIGHT) */}
            {isSelectionMode && (
                <div className="shrink-0 transition-opacity duration-200 animate-in fade-in ml-2">
                    <div className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                        // Removed blue background. Used simple border/icon logic.
                        isSelected ? "border-primary text-primary" : "border-muted-foreground/40 hover:border-muted-foreground"
                    )}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                </div>
            )}
        </div>
    )
})

HistoryItem.displayName = "HistoryItem"

interface IconButtonProps {
    onClick: () => void
    icon: React.ElementType
    title: string
    color: 'neutral' | 'orange' | 'danger'
}

function IconButton({ onClick, icon: Icon, title, color }: IconButtonProps) {
    const colors = {
        neutral: "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
        orange: "text-orange-500 hover:bg-orange-500/10",
        danger: "text-red-500 hover:bg-red-500/10"
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={(e) => { e.stopPropagation(); onClick() }}
                    className={cn(
                        "p-1.5 rounded-lg transition-all active:scale-95",
                        colors[color]
                    )}
                >
                    <Icon className="w-4 h-4" />
                </button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{title}</p>
            </TooltipContent>
        </Tooltip>
    )
}
