import { useRouter } from '@tanstack/react-router'
import { GpuIndicator } from './GpuIndicator'
import { openPath } from '@tauri-apps/plugin-opener'
import { ArrowDownToLine, Layers, HardDrive, FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { NotificationCenter } from '@/components/common'
import { useAppStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSystemStats } from '../queries/useSystemStats'

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes.toFixed(0)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`
}

export function StatusFooter() {
    const { settings, tasks, gpuType } = useAppStore(
        useShallow((s) => ({
            settings: s.settings,
            tasks: s.tasks,
            gpuType: s.gpuType
        }))
    )

    const { t } = useTranslation()

    // Font size styling
    const fontSizeStyle = settings.frontendFontSize === 'small' ? '11px' : settings.frontendFontSize === 'large' ? '14px' : '12px'

    // Smart Polling Logic - TanStack Query handles polling automatically
    const hasActiveDownloads = tasks.some(t => t.status === 'downloading' || t.status === 'fetching_info' || t.status === 'processing')

    // ✨ TanStack Query: Replaces 45+ lines of useEffect + useState + polling logic
    const { data: stats, isError: error } = useSystemStats(settings.downloadPath, hasActiveDownloads)

    // Helper to get current display disk (Target download path)
    const currentDisk = stats?.disks?.find(d =>
        settings.downloadPath.startsWith(d.mount_point) ||
        (d.mount_point.length === 3 && settings.downloadPath.toUpperCase().startsWith(d.mount_point.toUpperCase().slice(0, 2)))
    ) || stats?.disks?.[0]

    const displayDiskFree = currentDisk ? currentDisk.available_space : 0

    // StatusBar class - Apple Style Frosted Glass
    // strong blur, very light background for "vibrancy", subtle top border
    const barClass = "fixed bottom-0 left-0 right-0 z-40 bg-background/60 backdrop-blur-2xl border-t border-white/5 px-5 py-2 shadow-[0_-1px_20px_rgba(0,0,0,0.1)]"

    // Calculate global progress
    // Calculate global progress
    const activeDownloads = tasks.filter(t => t.status === 'downloading')
    const globalProgress = activeDownloads.length > 0
        ? activeDownloads.reduce((sum, t) => sum + (t.progress || 0), 0) / activeDownloads.length
        : 0

    // Navigation and Logic Helpers
    const router = useRouter()
    const navigateToSettings = (tab: string) => {
        router.navigate({ to: '/settings', search: { tab } })
    }

    // Disk Color Logic
    const getDiskColor = (available: number, total: number) => {
        if (total === 0) return "text-cyan-500"
        const percent = (available / total) * 100
        if (percent < 5 || available < 2 * 1024 * 1024 * 1024) return "text-red-500 animate-pulse" // < 5% or < 2GB
        if (percent < 15 || available < 10 * 1024 * 1024 * 1024) return "text-amber-500" // < 15% or < 10GB
        return "text-cyan-500/90"
    }
    const diskColor = currentDisk ? getDiskColor(currentDisk.available_space, currentDisk.total_space) : "text-primary/50"

    // Common Button Style for Status Bar Items
    // No background hover, just opacity shift for cleaner look without size scaling
    const statusItemClass = "h-auto w-auto flex items-center gap-2 p-1 rounded-md cursor-pointer text-muted-foreground/80 hover:text-foreground active:opacity-70"

    return (
        <div className={cn(barClass, "relative cq-footer")}>
            {/* Global Progress Bar - Slim & Elegant */}
            {activeDownloads.length > 0 && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-border/10 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all ease-out"
                        style={{ width: `${globalProgress}%` }}
                    />
                </div>
            )}

            <div className="w-full flex items-center justify-between">


                {/* --- LEFT SECTION --- */}
                <div
                    className="flex items-center gap-6"
                    style={{ fontSize: fontSizeStyle }}
                >
                    {stats && !error ? (
                        <>
                            {/* Disk Space (Target Only) - CLICKABLE */}
                            <Tooltip side="top">
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => navigateToSettings('downloads')}
                                        className={statusItemClass}
                                    >
                                        <HardDrive className={`w-3.5 h-3.5 ${diskColor} opacity-80`} />
                                        <span className={`${diskColor} font-mono font-medium tracking-tight tabular-nums`}>
                                            {formatBytes(displayDiskFree)}
                                            <span className="text-[9px] opacity-50 uppercase tracking-widest ml-1 footer-label">
                                                {t('statusbar.available') || 'Free'}
                                            </span>
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-background/80 backdrop-blur-xl border-white/10">
                                    <p className="text-xs font-medium">{`${t('statusbar.disk_free')}: ${currentDisk?.mount_point || ''} (Click to manage)`}</p>
                                </TooltipContent>
                            </Tooltip>

                            {/* Download Speed - CLICKABLE */}
                            <Tooltip side="top">
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => navigateToSettings('network')}
                                        className={statusItemClass}
                                    >
                                        <ArrowDownToLine className="w-3.5 h-3.5 text-blue-400 opacity-80" />
                                        <span className="text-blue-400 font-mono font-medium tracking-tight tabular-nums">{formatSpeed(stats.download_speed)}</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-background/80 backdrop-blur-xl border-white/10">
                                    <p className="text-xs font-medium">{`${t('statusbar.download_speed')} (Click to set limits)`}</p>
                                </TooltipContent>
                            </Tooltip>
                        </>
                    ) : (
                        <span className="text-muted-foreground/20 italic text-[10px] uppercase tracking-widest font-medium">{t('statusbar.stats_unavailable')}</span>
                    )}
                </div>

                {/* --- RIGHT SECTION --- */}
                <div
                    className="flex items-center gap-6"
                    style={{ fontSize: fontSizeStyle }}
                >
                    {/* Queue */}
                    {/* Queue - Smart Tooltip & Status */}
                    <Tooltip side="top">
                        <TooltipTrigger asChild>
                            <div className={`flex items-center gap-2 cursor-help ${tasks.some(t => t.status === 'downloading' || t.status === 'pending') ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}>
                                <Layers className={`w-3.5 h-3.5 ${tasks.some(t => t.status === 'downloading') ? 'text-indigo-400' : 'text-muted-foreground'}`} />
                                <span>
                                    {(() => {
                                        const activeCount = tasks.filter(task => task.status === 'downloading' || task.status === 'pending').length
                                        return activeCount > 0 && (
                                            <span className="text-indigo-300 font-mono font-bold text-[10px] absolute -top-1 -right-2 bg-indigo-500/10 px-1 rounded-full">{activeCount}</span>
                                        )
                                    })()}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background/80 backdrop-blur-xl border-white/10 p-3">
                            {(() => {
                                const activeTasks = tasks.filter(task => task.status === 'downloading')
                                const pendingTasks = tasks.filter(task => task.status === 'pending')
                                const totalActive = activeTasks.length + pendingTasks.length

                                if (totalActive === 0) {
                                    return <p className="text-xs font-medium text-muted-foreground">{t('statusbar.idle')}</p>
                                }

                                return (
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        <p className="text-xs font-bold text-foreground border-b border-white/10 pb-1 mb-1">
                                            {t('statusbar.active_downloads')} ({totalActive})
                                        </p>

                                        {/* List up to 3 active downloads */}
                                        {activeTasks.slice(0, 3).map(task => (
                                            <div key={task.id} className="flex items-center justify-between text-[11px] gap-4">
                                                <span className="truncate max-w-[120px] text-muted-foreground">{task.title || 'Unknown Video'}</span>
                                                <span className="font-mono text-indigo-400">{Math.round(task.progress || 0)}%</span>
                                            </div>
                                        ))}

                                        {/* Show overflow count */}
                                        {activeTasks.length > 3 && (
                                            <p className="text-[10px] text-muted-foreground italic">+ {activeTasks.length - 3} more downloading...</p>
                                        )}

                                        {/* Pending summary */}
                                        {pendingTasks.length > 0 && (
                                            <div className="pt-1 border-t border-white/5 mt-1">
                                                <p className="text-[10px] text-muted-foreground">{pendingTasks.length} queued</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                        </TooltipContent>
                    </Tooltip>

                    {/* GPU Status - Non-interactive indicator -> CLICKABLE */}
                    <Tooltip side="top">
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => navigateToSettings('system')}
                                className={`${statusItemClass} hover:opacity-100 opacity-80`}
                            >
                                <GpuIndicator gpuType={gpuType as "nvidia" | "amd" | "intel" | "apple" | "cpu"} hardwareDecoding={settings.hardwareDecoding} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background/80 backdrop-blur-xl border-white/10">
                            <p className="text-xs font-medium">{settings.hardwareDecoding ? `${t('statusbar.hw_accel')} (Click to configure)` : "Software Decoding"}</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Open Folder */}
                    <Tooltip side="top">
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => settings.downloadPath && openPath(settings.downloadPath)}
                                className={`${statusItemClass} text-muted-foreground hover:text-amber-400`}
                            >
                                <FolderOpen className="w-4 h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background/80 backdrop-blur-xl border-white/10">
                            <p className="text-xs font-medium">{t('statusbar.open_folder')}</p>
                        </TooltipContent>
                    </Tooltip>

                    <NotificationCenter />
                </div>
            </div>
        </div >
    )
}
