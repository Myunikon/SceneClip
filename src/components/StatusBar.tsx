import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { openPath } from '@tauri-apps/plugin-opener'
import { ArrowDownToLine, Layers, Zap, HardDrive, FolderOpen } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'
import { translations } from '../lib/locales'
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

export function StatusBar() {
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [error, setError] = useState(false)
    const { settings, tasks, gpuType } = useAppStore()

    // Get translations for current language
    const t = translations[settings.language as keyof typeof translations]?.statusbar || translations.en.statusbar

    // Font size styling
    const fontSizeStyle = settings.frontendFontSize === 'small' ? '11px' : settings.frontendFontSize === 'large' ? '14px' : '12px'

    useEffect(() => {
        let isMounted = true

        const fetchStats = async () => {
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
        }

        fetchStats()
        const interval = setInterval(fetchStats, 5000) // Update every 5 seconds

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [settings.downloadPath])

    // Helper to get current display disk (Target download path)
    const currentDisk = stats?.disks?.find(d =>
        settings.downloadPath.startsWith(d.mount_point) ||
        (d.mount_point.length === 3 && settings.downloadPath.toUpperCase().startsWith(d.mount_point.toUpperCase().slice(0, 2)))
    ) || stats?.disks?.[0]

    const displayDiskFree = currentDisk ? currentDisk.available_space : 0

    // StatusBar class
    const barClass = "fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-t border-border/50 px-4 py-1.5"

    // Calculate global progress
    const activeDownloads = tasks.filter(t => t.status === 'downloading')
    const globalProgress = activeDownloads.length > 0
        ? activeDownloads.reduce((sum, t) => sum + (t.progress || 0), 0) / activeDownloads.length
        : 0

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
                            {/* Disk Space (Target Only) */}
                            <div className="flex items-center gap-1.5" title={`${t.disk_free}: ${currentDisk?.mount_point || ''}`}>
                                <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
                                <span className="text-cyan-500 font-mono font-bold">{formatBytes(displayDiskFree)} <span className="text-[10px] opacity-70 uppercase tracking-tighter ml-0.5">{t.available || 'Free'}</span></span>
                            </div>

                            {/* Download Speed */}
                            <div className="flex items-center gap-1.5" title={t.download_speed}>
                                <ArrowDownToLine className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-blue-500 font-mono font-bold">{formatSpeed(stats.download_speed)}</span>
                            </div>
                        </>
                    ) : (
                        <span className="text-muted-foreground/30 italic text-[10px] uppercase tracking-widest">{t.stats_unavailable}</span>
                    )}
                </div>

                {/* --- RIGHT SECTION --- */}
                <div
                    className="flex items-center gap-4 text-muted-foreground"
                    style={{ fontSize: fontSizeStyle }}
                >
                    {/* Queue */}
                    <div className="flex items-center gap-1.5" title={t.active_downloads}>
                        <Layers className="w-3.5 h-3.5 text-purple-500" />
                        <span>
                            {(() => {
                                const activeCount = tasks.filter(task => task.status === 'downloading' || task.status === 'pending').length
                                const queuedCount = tasks.filter(task => task.status === 'pending').length
                                return (
                                    <>
                                        {activeCount > 0 ? (
                                            <span className="text-purple-400">{activeCount} {t.active}</span>
                                        ) : (
                                            <span className="text-muted-foreground/50">{t.idle}</span>
                                        )}
                                        {queuedCount > 0 && (
                                            <span className="text-muted-foreground/50 ml-1 hidden sm:inline">({queuedCount} {t.queued})</span>
                                        )}
                                    </>
                                )
                            })()}
                        </span>
                    </div>

                    {/* GPU Status - Non-interactive indicator */}
                    <div className="flex items-center gap-1.5" title={settings.hardwareDecoding ? t.hw_accel : "Software Decoding"}>
                        {(() => {
                            const vendorLabels: Record<string, string> = {
                                'nvidia': t.nvidia_gpu,
                                'amd': t.amd_gpu,
                                'intel': t.intel_gpu,
                                'apple': t.apple_gpu,
                                'cpu': t.cpu_mode
                            }
                            const displayLabel = vendorLabels[gpuType] || 'GPU'

                            if (!settings.hardwareDecoding) {
                                return (
                                    <>
                                        <Zap className="w-3.5 h-3.5 text-muted-foreground/30" />
                                        <span className="text-muted-foreground/40 font-bold uppercase tracking-tighter">SFW</span>
                                    </>
                                )
                            }

                            return gpuType !== 'cpu' ? (
                                <>
                                    <span className="relative flex h-2 w-2 mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 will-change-transform"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    </span>
                                    <span className="text-emerald-500 font-bold uppercase tracking-tighter">{displayLabel}</span>
                                </>
                            ) : (
                                <span className="text-muted-foreground/30 font-bold uppercase tracking-tighter">CPU</span>
                            )
                        })()}
                    </div>

                    {/* Open Folder */}
                    <button
                        onClick={() => settings.downloadPath && openPath(settings.downloadPath)}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                        title={t.open_folder}
                    >
                        <FolderOpen className="w-4 h-4" />
                    </button>

                    <NotificationCenter />
                </div>
            </div>
        </div>
    )
}
