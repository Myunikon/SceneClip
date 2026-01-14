import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { openPath } from '@tauri-apps/plugin-opener'
import { Cpu, MemoryStick, ArrowDownToLine, ArrowUpFromLine, Layers, Zap, HardDrive, FolderOpen } from 'lucide-react'
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
    const [showDisks, setShowDisks] = useState(false)
    const [selectedMount, setSelectedMount] = useState<string | null>(null)
    const { settings, tasks, gpuType } = useAppStore()
    
    // Get translations for current language
    const t = translations[settings.language as keyof typeof translations]?.statusbar || translations.en.statusbar
    
    // Font size class based on settings - use fixed pixel values to avoid root font-size scaling
    // StatusBar should stay compact regardless of global font size
    const fontSizeStyle = settings.frontendFontSize === 'small' ? '11px' : settings.frontendFontSize === 'large' ? '14px' : '12px'
    
    // Dynamic font sizes for popover
    const popoverBaseSize = settings.frontendFontSize === 'large' ? 'text-sm' : 'text-xs'
    const popoverSmallSize = settings.frontendFontSize === 'large' ? 'text-xs' : 'text-[10px]'

    useEffect(() => {
        let isMounted = true
        
        const fetchStats = async () => {
            try {
                const result = await invoke<SystemStats>('get_system_stats', { downloadPath: settings.downloadPath })
                if (isMounted) {
                    setStats(result)
                    setError(false)
                    
                    // Set default selected mount if not set (prefer C: or /)
                    if (!selectedMount && result.disks && result.disks.length > 0) {
                        const defaultDisk = result.disks.find(d => d.mount_point === "C:\\\\" || d.mount_point === "/") || result.disks[0]
                        setSelectedMount(defaultDisk.mount_point)
                    }
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
    }, [selectedMount]) // Add selectedMount dependency to re-check if needed, though mostly for init

    // Handle clicking outside to close popover
    useEffect(() => {
        if (showDisks) {
            const handleClick = () => setShowDisks(false)
            document.addEventListener('click', handleClick)
            return () => document.removeEventListener('click', handleClick)
        }
    }, [showDisks])

    // Helper to get current display disk
    const currentDisk = stats?.disks?.find(d => d.mount_point === selectedMount) 
        || stats?.disks?.find(d => d.mount_point === "C:\\\\" || d.mount_point === "/")
        || (stats?.disks && stats.disks[0])

    const displayDiskFree = currentDisk ? currentDisk.available_space : 0

    // Colors for usage levels
    const cpuColor = stats && stats.cpu_usage > 80 ? 'text-red-500' : stats && stats.cpu_usage > 50 ? 'text-yellow-500' : 'text-green-500'
    const memColor = stats && stats.memory_percent > 80 ? 'text-red-500' : stats && stats.memory_percent > 60 ? 'text-yellow-500' : 'text-green-500'

    // Use solid background in low-perf mode
    const barClass = settings.lowPerformanceMode
        ? "fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border px-4 py-1.5"
        : "fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-t border-border/50 px-4 py-1.5"

    // Calculate global progress from active downloads
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
                        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300 ease-out"
                        style={{ width: `${globalProgress}%` }}
                    />
                </div>
            )}
            
            <div className="w-full flex items-center justify-between">
                {/* --- LEFT SECTION: UNIFORM SPACING --- */}
                <div 
                    className="flex items-center gap-4 text-muted-foreground"
                    style={{ fontSize: fontSizeStyle }}
                >
                    {stats && !error ? (
                        <>
                            {/* CPU */}
                            <div className="flex items-center gap-1.5" title={`${t.cpu_usage}: ${stats.cpu_usage.toFixed(1)}%`}>
                                <Cpu className={`w-3.5 h-3.5 ${cpuColor}`} />
                                <span className={`${cpuColor} font-mono`}>{stats.cpu_usage.toFixed(0)}%</span>
                            </div>

                            {/* RAM */}
                            <div className="flex items-center gap-1.5" title={`${t.ram_usage}: ${formatBytes(stats.memory_used)} / ${formatBytes(stats.memory_total)}`}>
                                <MemoryStick className={`w-3.5 h-3.5 ${memColor}`} />
                                <span className={`${memColor} font-mono`}>{stats.memory_percent.toFixed(0)}%</span>
                                <span className="text-muted-foreground/50 hidden lg:inline">
                                    ({formatBytes(stats.memory_used)})
                                </span>
                            </div>

                            {/* Disk */}
                            <div className="relative group/disk">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowDisks(!showDisks)
                                    }}
                                    className="hidden md:flex items-center hover:bg-secondary/50 rounded px-1.5 py-0.5 transition-colors cursor-pointer gap-1.5"
                                    title={`${t.disk_free}: ${currentDisk?.mount_point || ''} - Click to see all drives`}
                                >
                                    <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
                                    <span className="text-cyan-500 font-mono">{formatBytes(displayDiskFree)}</span>
                                    {currentDisk && <span className="text-[0.85em] text-muted-foreground/50">({currentDisk.mount_point.slice(0, 1)})</span>}
                                </button>
                                {/* Disks Popover (Preserved) */}
                                {showDisks && stats.disks && (
                                    <div 
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 z-50 p-2"
                                    >
                                        <div className={`${popoverBaseSize} font-semibold text-muted-foreground px-2 py-1 mb-1 border-b border-border/50`}>
                                            {t.storage_devices || 'Storage Devices'}
                                        </div>
                                        <div className="space-y-1">
                                            {stats.disks.map((disk, i) => {
                                                const used = disk.total_space - disk.available_space
                                                const percent = (used / disk.total_space) * 100
                                                const freeGB = disk.available_space / (1024 * 1024 * 1024)
                                                const barColor = freeGB < 5 ? 'bg-red-500' : freeGB < 20 ? 'bg-yellow-500' : 'bg-cyan-500'
                                                const isSelected = selectedMount === disk.mount_point
                                                
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className={`p-2 hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-secondary/20 ring-1 ring-border' : ''}`}
                                                        onClick={() => {
                                                            setSelectedMount(disk.mount_point)
                                                            setShowDisks(false)
                                                        }}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <HardDrive className={`w-3 h-3 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                                                <span className={`${popoverBaseSize} font-medium truncate`} title={disk.mount_point}>
                                                                    {disk.name || 'Disk'} ({disk.mount_point})
                                                                </span>
                                                            </div>
                                                            <span className={`${popoverSmallSize} text-muted-foreground shrink-0`}>
                                                                {formatBytes(disk.available_space)} {t.available || 'free'}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                                                style={{ width: `${percent}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Network */}
                            <div className="hidden lg:flex items-center gap-1.5" title={t.download_speed}>
                                <ArrowDownToLine className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-blue-500 font-mono">{formatSpeed(stats.download_speed)}</span>
                            </div>
                            <div className="hidden lg:flex items-center gap-1.5" title={t.upload_speed}>
                                <ArrowUpFromLine className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-mono">{formatSpeed(stats.upload_speed)}</span>
                            </div>
                        </>
                    ) : (
                        <span className="text-muted-foreground/50">{t.stats_unavailable}</span>
                    )}
                </div>

                {/* --- RIGHT SECTION: UNIFORM SPACING --- */}
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

                    {/* GPU */}
                    <button 
                        className="flex items-center hover:bg-secondary/50 rounded px-1.5 py-0.5 transition-colors cursor-pointer gap-1.5"
                        title={`${t.hw_accel} - Click to change mode (Auto -> CPU -> GPU)`}
                        onClick={() => {
                            const current = settings.hardwareDecoding || 'auto'
                            const next = current === 'auto' ? 'cpu' : current === 'cpu' ? 'gpu' : 'auto'
                            useAppStore.getState().updateSettings({ hardwareDecoding: next })
                        }}
                    >
                        {(() => {
                            const hwSetting = settings.hardwareDecoding || 'auto'
                            const vendorLabels: Record<string, string> = {
                                'nvidia': t.nvidia_gpu,
                                'amd': t.amd_gpu,
                                'intel': t.intel_gpu,
                                'apple': t.apple_gpu,
                                'cpu': t.cpu_mode
                            }
                            const displayLabel = vendorLabels[gpuType] || 'GPU'
                            
                            if (hwSetting === 'cpu') {
                                return (
                                    <>
                                        <Zap className="w-3.5 h-3.5 text-muted-foreground/50" />
                                        <span className="text-muted-foreground/50">{t.cpu_mode}</span>
                                    </>
                                )
                            } else if (hwSetting === 'gpu') {
                                return (
                                    <>
                                        <span className="relative flex h-2 w-2 mr-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 will-change-transform"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                        </span>
                                        <span className="text-yellow-400">{displayLabel} <span className="hidden sm:inline">{t.forced}</span></span>
                                    </>
                                )
                            } else {
                                return gpuType !== 'cpu' ? (
                                    <>
                                        <span className="relative flex h-2 w-2 mr-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 will-change-transform"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <span className="text-green-400">{displayLabel}</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-3.5 h-3.5 text-muted-foreground/50" />
                                        <span className="text-muted-foreground/50">{t.auto_cpu}</span>
                                    </>
                                )
                            }
                        })()}
                    </button>

                    {/* Folder */}
                    <button 
                        onClick={() => settings.downloadPath && openPath(settings.downloadPath)}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                        title={t.open_folder}
                    >
                        <FolderOpen className="w-4 h-4" />
                    </button>
                    
                    {/* Notif */}
                    <NotificationCenter />
                </div>
            </div>
        </div>
    )
}
