import { useState, useEffect, useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { GpuIndicator } from './statusbar/GpuIndicator'
import { invoke } from '@tauri-apps/api/core'
import { openPath } from '@tauri-apps/plugin-opener'
import { ArrowDownToLine, Layers, HardDrive, FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NotificationCenter } from './NotificationCenter'
import { useAppStore } from '../store'

interface DiskInfo {
    name: string
    mount_point: string
    total_space: number
    available_space: number
}

interface SystemStats {
    cpu_usage: number
    memory_used: number
    memory_total: number
    memory_percent: number
    download_speed: number
    upload_speed: number
    disk_free: number
    disk_total: number
    disks: DiskInfo[]
}

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
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [error, setError] = useState(false)
    const { settings, tasks, gpuType } = useAppStore()

    const { t } = useTranslation()

    // Font size styling
    const fontSizeStyle = settings.frontendFontSize === 'small' ? '11px' : settings.frontendFontSize === 'large' ? '14px' : '12px'

    // Smart Polling Logic
    const hasActiveDownloads = tasks.some(t => t.status === 'downloading' || t.status === 'fetching_info' || t.status === 'processing')

    useEffect(() => {
        let isMounted = true
        let timeoutId: NodeJS.Timeout

        const fetchStats = async () => {
            // Pause if window is hidden (minimized/background tab) to save resources
            if (document.hidden) return

            try {
                const result = await invoke<SystemStats>('get_system_stats', { downloadPath: settings.downloadPath })
                if (isMounted) {
                    setStats(result)
                    setError(false)
                }
            } catch (e) {
                console.error('Failed to get system stats:', e)
                if (isMounted) setError(true)
            }

            // Schedule next poll based on activity
            // Active: 1s for real-time speed updates
            // Idle: 5s for general system monitoring
            const nextInterval = hasActiveDownloads ? 1000 : 5000
            if (isMounted) {
                timeoutId = setTimeout(fetchStats, nextInterval)
            }
        }

        // Initial fetch
        fetchStats()

        // Resume immediately on visibility change
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Clear existing timeout to prevent double-firing and fetch immediately
                clearTimeout(timeoutId)
                fetchStats()
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            isMounted = false
            clearTimeout(timeoutId)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [settings.downloadPath, hasActiveDownloads])

    // Helper to get current display disk (Target download path)
    const currentDisk = stats?.disks?.find(d =>
        settings.downloadPath.startsWith(d.mount_point) ||
        (d.mount_point.length === 3 && settings.downloadPath.toUpperCase().startsWith(d.mount_point.toUpperCase().slice(0, 2)))
    ) || stats?.disks?.[0]

    const displayDiskFree = currentDisk ? currentDisk.available_space : 0

    // StatusBar class
    const barClass = "fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-t border-border/50 px-4 py-1.5"

    // Calculate global progress
    const { activeDownloads, globalProgress } = useMemo(() => {
        const active = tasks.filter(t => t.status === 'downloading')
        const progress = active.length > 0
            ? active.reduce((sum, t) => sum + (t.progress || 0), 0) / active.length
            : 0
        return { activeDownloads: active, globalProgress: progress }
    }, [tasks])

    // Navigation and Logic Helpers
    const router = useRouter()
    const navigateToSettings = (tab: string) => {
        router.navigate({ to: '/settings', search: { tab } })
        // Since settings tabs are internal state in SettingsView, we might need a way to deep link.
        // For now, just navigating to /settings is a good start, but ideally we'd pass state.
        // Actually, SettingsView uses local state for tabs. We might need to handle this later.
        // Let's just go to /settings for now.
    }

    // Disk Color Logic
    const getDiskColor = (available: number, total: number) => {
        if (total === 0) return "text-cyan-500"
        const percent = (available / total) * 100
        if (percent < 5 || available < 2 * 1024 * 1024 * 1024) return "text-red-500 animate-pulse" // < 5% or < 2GB
        if (percent < 15 || available < 10 * 1024 * 1024 * 1024) return "text-yellow-500" // < 15% or < 10GB
        return "text-cyan-500"
    }
    const diskColor = currentDisk ? getDiskColor(currentDisk.available_space, currentDisk.total_space) : "text-cyan-500"

    return (
        <div className={`${barClass} relative`}>
            {/* Global Progress Bar */}
            {activeDownloads.length > 0 && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-border/30 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-300 ease-out"
                        style={{ width: `${globalProgress}%` }}
                    />
                </div>
            )}

            <div className="w-full flex items-center justify-between">


                {/* --- LEFT SECTION --- */}
                <div
                    className="flex items-center gap-4 text-muted-foreground"
                    style={{ fontSize: fontSizeStyle }}
                >
                    {stats && !error ? (
                        <>
                            {/* Disk Space (Target Only) - CLICKABLE */}
                            <button
                                onClick={() => navigateToSettings('downloads')}
                                className="flex items-center gap-1.5 hover:bg-secondary/50 p-1 rounded transition-colors cursor-pointer group"
                                title={`${t('statusbar.disk_free')}: ${currentDisk?.mount_point || ''} (Click to manage)`}
                            >
                                <HardDrive className={`w-3.5 h-3.5 ${diskColor}`} />
                                <span className={`${diskColor} font-mono font-bold tabular-nums`}>
                                    {formatBytes(displayDiskFree)}
                                    <span className="text-[10px] opacity-70 uppercase tracking-tighter ml-0.5 group-hover:opacity-100 transition-opacity">
                                        {t('statusbar.available') || 'Free'}
                                    </span>
                                </span>
                            </button>

                            {/* Download Speed - CLICKABLE */}
                            <button
                                onClick={() => navigateToSettings('network')}
                                className="flex items-center gap-1.5 hover:bg-secondary/50 p-1 rounded transition-colors cursor-pointer"
                                title={`${t('statusbar.download_speed')} (Click to set limits)`}
                            >
                                <ArrowDownToLine className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-blue-500 font-mono font-bold tabular-nums">{formatSpeed(stats.download_speed)}</span>
                            </button>
                        </>
                    ) : (
                        <span className="text-muted-foreground/30 italic text-[10px] uppercase tracking-widest">{t('statusbar.stats_unavailable')}</span>
                    )}
                </div>

                {/* --- RIGHT SECTION --- */}
                <div
                    className="flex items-center gap-4 text-muted-foreground"
                    style={{ fontSize: fontSizeStyle }}
                >
                    {/* Queue */}
                    <div className="flex items-center gap-1.5" title={t('statusbar.active_downloads')}>
                        <Layers className="w-3.5 h-3.5 text-purple-500" />
                        <span>
                            {(() => {
                                const activeCount = tasks.filter(task => task.status === 'downloading' || task.status === 'pending').length
                                const queuedCount = tasks.filter(task => task.status === 'pending').length
                                return (
                                    <>
                                        {activeCount > 0 ? (
                                            <span className="text-purple-400">{activeCount} {t('statusbar.active')}</span>
                                        ) : (
                                            <span className="text-muted-foreground/50">{t('statusbar.idle')}</span>
                                        )}
                                        {queuedCount > 0 && (
                                            <span className="text-muted-foreground/50 ml-1 hidden sm:inline font-mono tabular-nums">({queuedCount} {t('statusbar.queued')})</span>
                                        )}
                                    </>
                                )
                            })()}
                        </span>
                    </div>

                    {/* GPU Status - Non-interactive indicator -> CLICKABLE */}
                    <button
                        onClick={() => navigateToSettings('advanced')}
                        className="flex items-center gap-1.5 hover:bg-secondary/50 p-1 rounded transition-colors cursor-pointer font-mono tabular-nums"
                        title={settings.hardwareDecoding ? `${t('statusbar.hw_accel')} (Click to configure)` : "Software Decoding (Click to enable GPU)"}
                    >
                        <GpuIndicator gpuType={gpuType as "nvidia" | "amd" | "intel" | "apple" | "cpu"} hardwareDecoding={settings.hardwareDecoding} />
                    </button>

                    {/* Open Folder */}
                    <button
                        onClick={() => settings.downloadPath && openPath(settings.downloadPath)}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                        title={t('statusbar.open_folder')}
                    >
                        <FolderOpen className="w-4 h-4" />
                    </button>

                    <NotificationCenter />
                </div>
            </div>
        </div>
    )
}
