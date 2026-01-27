import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { notify } from '../lib/notify'
import { useAppStore, DownloadTask } from '../store'
import { useTranslation } from 'react-i18next'
import {
    Search,
    Filter,
    CheckCircle2,
    Music,
    FileVideo,
    ArrowUp,
    ArrowDown,
    LayoutGrid,
    RefreshCw,
    Trash2,
    ListChecks,
    RotateCcw,
    AlertTriangle
} from 'lucide-react'
import { openPath } from '@tauri-apps/plugin-opener'
import { exists } from '@tauri-apps/plugin-fs'

import { CommandModal } from './CommandModal'
import { CompressDialog } from './CompressDialog'
import { parseSize, cn } from '../lib/utils'
import { SegmentedControl } from './ui/SegmentedControl'
import { HistoryItem } from './history/HistoryItem'

// --- Dummy Data (40 Diverse Scenarios for Demo) ---
const DUMMY_TASKS: Partial<DownloadTask>[] = [
    // ============================================================
    // === COMPLETED - RECENT (Today) ===
    // ============================================================
    {
        id: 'dummy-1',
        title: '4K Nature Documentary - Amazon Rainforest',
        url: 'https://www.youtube.com/watch?v=amazon4k',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 15, // 15 mins ago
        fileSize: '2.8 GB',
        format: 'Video',
        _options: { videoCodec: 'av1', container: 'mkv' },
        filePath: 'D:\\Videos\\Nature\\Amazon_4K.mkv'
    },
    {
        id: 'dummy-2',
        title: 'Chill Lo-Fi Beats - Study Session Mix',
        url: 'https://www.youtube.com/watch?v=lofi2024',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
        fileSize: '95 MB',
        format: 'Audio',
        _options: { container: 'mp3', audioBitrate: '320' },
        filePath: 'D:\\Music\\Lofi_Study_Mix.mp3'
    },
    {
        id: 'dummy-3',
        title: 'TikTok Viral Dance Compilation 2024',
        url: 'https://www.tiktok.com/@viral/video/999888',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
        fileSize: '125 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'D:\\TikTok\\Viral_Dance_2024.mp4'
    },

    // === YESTERDAY ===
    {
        id: 'dummy-4',
        title: 'Podcast: Joe Rogan Experience #2100',
        url: 'https://www.youtube.com/watch?v=jre2100',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 18, // 18 hours ago
        fileSize: '180 MB',
        format: 'Audio',
        _options: { container: 'm4a', audioBitrate: '192' },
        filePath: 'D:\\Podcasts\\JRE_2100.m4a'
    },
    {
        id: 'dummy-5',
        title: 'Instagram Reel - Cooking Tutorial: Pasta Carbonara',
        url: 'https://www.instagram.com/reel/pasta123',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 22, // 22 hours ago
        fileSize: '35 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'D:\\Cooking\\Carbonara_Reel.mp4'
    },

    // === CLIP/RANGE DOWNLOADS ===
    {
        id: 'dummy-6',
        title: 'Epic Gaming Moment - Elden Ring Boss Fight',
        url: 'https://www.youtube.com/watch?v=eldenring1',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 26,
        fileSize: '45 MB',
        format: 'Video',
        range: '12:30 - 15:45',
        _options: { videoCodec: 'h264', container: 'mp4', rangeStart: '12:30', rangeEnd: '15:45' },
        filePath: 'D:\\Gaming\\EldenRing_BossFight.mp4'
    },
    {
        id: 'dummy-7',
        title: 'Movie Clip - Inception Ending Scene',
        url: 'https://www.youtube.com/watch?v=inception',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 30,
        fileSize: '22 MB',
        format: 'Video',
        range: '02:15:00 - 02:18:30',
        _options: { videoCodec: 'av1', container: 'mp4', rangeStart: '02:15:00', rangeEnd: '02:18:30' },
        filePath: 'D:\\Movies\\Inception_Ending.mp4'
    },

    // === STOPPED/INTERRUPTED ===
    {
        id: 'dummy-8',
        title: 'Documentary: Planet Earth III - Full Episode',
        url: 'https://www.youtube.com/watch?v=planetearth3',
        status: 'stopped',
        statusDetail: 'Interrupted by Restart',
        completedAt: Date.now() - 1000 * 60 * 60 * 48,
        fileSize: '3.2 GB',
        format: 'Video',
        progress: 67,
        _options: { videoCodec: 'av1', container: 'mkv' },
        filePath: 'D:\\Documentaries\\PlanetEarth3.mkv'
    },
    {
        id: 'dummy-9',
        title: 'Live Concert - Coldplay Tokyo 2024',
        url: 'https://www.youtube.com/watch?v=coldplay2024',
        status: 'stopped',
        statusDetail: 'User cancelled',
        completedAt: Date.now() - 1000 * 60 * 60 * 52,
        fileSize: '1.8 GB',
        format: 'Video',
        progress: 34,
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'D:\\Concerts\\Coldplay_Tokyo.mp4'
    },

    // === TWITTER/X ===
    {
        id: 'dummy-10',
        title: 'SpaceX Starship Super Heavy Landing',
        url: 'https://x.com/SpaceX/status/1876543210',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
        fileSize: '88 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'D:\\SpaceX\\Starship_Landing.mp4'
    },
    {
        id: 'dummy-11',
        title: 'Elon Musk AI Announcement Thread',
        url: 'https://x.com/elonmusk/status/9876543',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 75,
        fileSize: '15 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'D:\\Twitter\\Musk_AI.mp4'
    },

    // === FACEBOOK ===
    {
        id: 'dummy-12',
        title: 'Viral Cat Video - Cat vs Cucumber',
        url: 'https://www.facebook.com/watch/?v=cat123',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 96, // 4 days ago
        fileSize: '28 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'D:\\Funny\\Cat_Cucumber.mp4'
    },

    // === HIGH QUALITY AUDIO ===
    {
        id: 'dummy-13',
        title: 'FLAC: Pink Floyd - The Dark Side of the Moon',
        url: 'https://www.youtube.com/watch?v=pinkfloyd',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 100,
        fileSize: '650 MB',
        format: 'Audio',
        _options: { container: 'flac', audioBitrate: 'lossless' },
        filePath: 'D:\\Music\\FLAC\\DarkSideOfTheMoon.flac'
    },
    {
        id: 'dummy-14',
        title: 'Audiobook: Atomic Habits by James Clear',
        url: 'https://www.youtube.com/watch?v=atomichabits',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 120, // 5 days ago
        fileSize: '320 MB',
        format: 'Audio',
        _options: { container: 'm4a', audioBitrate: '128' },
        filePath: 'D:\\Audiobooks\\Atomic_Habits.m4a'
    },

    // === MISSING FILE SCENARIOS ===
    {
        id: 'dummy-15',
        title: '[DELETED] Old Tutorial - This File Was Moved',
        url: 'https://www.youtube.com/watch?v=oldtut',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 24 * 6, // 6 days ago
        fileSize: '450 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'C:\\Deleted\\OldTutorial.mp4'
    },
    {
        id: 'dummy-16',
        title: '[MISSING] Archived Stream - File Not Found',
        url: 'https://www.twitch.tv/videos/archived123',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
        fileSize: '2.1 GB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'X:\\NonExistent\\Stream.mp4'
    },

    // === LARGE FILES ===
    {
        id: 'dummy-17',
        title: '8K HDR: Tokyo City Walk at Night',
        url: 'https://www.youtube.com/watch?v=tokyo8k',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
        fileSize: '12.5 GB',
        format: 'Video',
        _options: { videoCodec: 'av1', container: 'mkv' },
        filePath: 'D:\\8K\\Tokyo_Night_8K.mkv'
    },

    // === SUBTITLE DOWNLOADS ===
    {
        id: 'dummy-18',
        title: 'Korean Drama: Squid Game S2E01 (with Subs)',
        url: 'https://www.youtube.com/watch?v=squidgame2',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 24 * 12, // 12 days ago
        fileSize: '890 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4', embedSubtitles: true },
        filePath: 'D:\\KDrama\\SquidGame_S2E01.mp4'
    },

    // === OLD ENTRIES ===
    {
        id: 'dummy-19',
        title: 'Vintage Music: 80s Synthwave Collection',
        url: 'https://www.youtube.com/watch?v=synthwave80s',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 24 * 20, // 20 days ago
        fileSize: '210 MB',
        format: 'Audio',
        _options: { container: 'mp3', audioBitrate: '256' },
        filePath: 'D:\\Music\\Synthwave_80s.mp3'
    },
    {
        id: 'dummy-20',
        title: 'Very Old Download - Almost Expired',
        url: 'https://www.youtube.com/watch?v=oldvideo',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 24 * 28, // 28 days ago (near 30 day retention)
        fileSize: '550 MB',
        format: 'Video',
        _options: { videoCodec: 'vp9', container: 'webm' },
        filePath: 'D:\\Old\\Almost_Expired.webm'
    }
]


export function HistoryView() {
    const { tasks, deleteHistory, clearTask, retryTask, retryAllFailed, recoverDownloads, getInterruptedCount, settings } = useAppStore()
    const language = settings.language
    const { t } = useTranslation()

    // --- Filtering & Sorting State ---
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('date') // date, size, source
    const [filterFormat, setFilterFormat] = useState('all') // all, video, audio
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // --- UI State ---
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }
        if (showMenu) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showMenu])

    // --- Pagination State ---
    const [visibleCount, setVisibleCount] = useState(20)

    // --- Selection State ---
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode)
        setSelectedIds(new Set())
    }

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const selectAll = () => {
        if (selectedIds.size === historyTasks.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(historyTasks.map(t => t.id)))
        }
    }

    const deleteSelected = useCallback(() => {
        if (confirm(t('history_menu.confirm_delete_msg', { count: selectedIds.size }) || `Are you sure you want to delete ${selectedIds.size} items?`)) {
            selectedIds.forEach(id => clearTask(id))
            setIsSelectionMode(false)
            setSelectedIds(new Set())
            notify.success(t('history_menu.toast_deleted', { count: selectedIds.size }) || `Deleted ${selectedIds.size} items`)
        }
    }, [selectedIds, clearTask, t])

    const historyTasks = useMemo(() => {
        const realTasks = tasks.filter(t => t.status === 'completed' || t.status === 'stopped')
        const allTasks = [...realTasks, ...(DUMMY_TASKS as DownloadTask[])]

        let filtered = allTasks

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(t => t.title.toLowerCase().includes(query))
        }

        if (filterFormat !== 'all') {
            filtered = filtered.filter(t => {
                const isAudio = t.format?.toLowerCase().includes('audio') || t.url.toLowerCase().includes('audio')
                return filterFormat === 'audio' ? isAudio : !isAudio
            })
        }

        filtered.sort((a, b) => {
            let valA: number | string = 0
            let valB: number | string = 0

            switch (filterType) {
                case 'size':
                    valA = parseSize(a.fileSize || '0')
                    valB = parseSize(b.fileSize || '0')
                    break
                case 'source':
                    try {
                        valA = new URL(a.url).hostname
                        valB = new URL(b.url).hostname
                    } catch {
                        valA = a.url || ''
                        valB = b.url || ''
                    }
                    break
                case 'date':
                default:
                    valA = a.completedAt || 0
                    valB = b.completedAt || 0
                    break
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1
            return 0
        })

        return filtered
    }, [tasks, searchQuery, filterType, sortOrder, filterFormat])

    // Verification State
    const [missingFileIds, setMissingFileIds] = useState<Set<string>>(new Set())
    const [isVerifying, setIsVerifying] = useState(false)

    const handleVerifyFiles = async () => {
        setIsVerifying(true)
        const missing = new Set<string>()
        const chunks = []
        for (let i = 0; i < historyTasks.length; i += 10) {
            chunks.push(historyTasks.slice(i, i + 10))
        }

        for (const chunk of chunks) {
            await Promise.all(chunk.map(async (task) => {
                if (task.id.startsWith('dummy-')) {
                    if (task.filePath?.includes("Deleted")) missing.add(task.id)
                    return
                }

                if (task.filePath) {
                    try {
                        const fileExists = await exists(task.filePath)
                        if (!fileExists) missing.add(task.id)
                    } catch {
                        missing.add(task.id)
                    }
                }
            }))
        }
        setMissingFileIds(missing)
        setIsVerifying(false)
        if (missing.size > 0) notify.warning(t('history.scan_missing_files', { count: missing.size }), { duration: 4000 })
        else notify.success(t('history.scan_healthy_files'), { duration: 3000 })
    }

    const handleOpenFolder = useCallback(async (path: string) => {
        try { await openPath(path); } catch {
            notify.error(t('errors.folder_not_found'));
        }
    }, [t])

    const handlePlayFile = useCallback(async (path: string) => {
        if (!path) return notify.warning(t('history.file_not_found'))
        try { await openPath(path); } catch {
            notify.error(t('errors.file_desc'));
        }
    }, [t])

    const handleRemove = useCallback((id: string) => clearTask(id), [clearTask])
    const handleRetry = useCallback((id: string) => { retryTask(id); notify.success("Redownload Started") }, [retryTask])
    const handleViewCommand = useCallback((task: DownloadTask) => { setSelectedTask(task); setIsCommandOpen(true) }, [])

    // NEW: Compress dialog state
    const [selectedTask, setSelectedTask] = useState<DownloadTask | null>(null)
    const [isCommandOpen, setIsCommandOpen] = useState(false)
    const [compressTask, setCompressTask] = useState<DownloadTask | null>(null)
    const [isCompressOpen, setIsCompressOpen] = useState(false)
    const handleCompress = useCallback((task: DownloadTask) => {
        setCompressTask(task)
        setIsCompressOpen(true)
    }, [])

    return (
        <div className="flex flex-col h-full bg-background/50">
            {/* Header: Translucent Glass Effect */}
            <div className="shrink-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/10 supports-[backdrop-filter]:bg-background/60">
                <div className="px-6 py-4 space-y-4 max-w-7xl mx-auto">
                    {/* Top Row: Title & Actions */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold tracking-tight text-foreground/90">
                            {t('history.title')}
                        </h2>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Retry All Failed Button */}
                            {(() => {
                                const failedCount = tasks.filter(t => t.status === 'error').length
                                if (failedCount === 0) return null
                                return (
                                    <button
                                        onClick={() => {
                                            retryAllFailed()
                                            notify.success(`Retrying ${failedCount} failed download${failedCount > 1 ? 's' : ''}`)
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Retry All ({failedCount})
                                    </button>
                                )
                            })()}

                            {/* Recover Interrupted Button */}
                            {(() => {
                                const interruptedCount = getInterruptedCount()
                                if (interruptedCount === 0) return null
                                return (
                                    <button
                                        onClick={() => {
                                            const recovered = recoverDownloads()
                                            if (recovered > 0) {
                                                notify.success(`Recovered ${recovered} download${recovered > 1 ? 's' : ''}`)
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Recover ({interruptedCount})
                                    </button>
                                )
                            })()}
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-4 justify-between flex-wrap">
                        {/* Segmented Control */}
                        <div className="w-full sm:w-auto overflow-x-auto">
                            <SegmentedControl
                                value={filterFormat}
                                onChange={setFilterFormat}
                                options={[
                                    { value: 'all', label: t('all') || "All" },
                                    { value: 'video', label: t('video') || "Video", icon: FileVideo },
                                    { value: 'audio', label: t('audio') || "Audio", icon: Music }
                                ]}
                            />
                        </div>

                        {/* Search & Sort & Select */}
                        <div className="flex gap-2 flex-1 sm:flex-none items-center">
                            <div className="relative group flex-1 sm:w-60 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t('history.search_placeholder') || "Search history..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-9 bg-secondary/50 hover:bg-secondary/70 focus:bg-background rounded-lg pl-9 pr-4 text-sm transition-all outline-none placeholder:text-muted-foreground/50"
                                />
                            </div>

                            {/* Select Mode Toggle */}
                            <button
                                onClick={toggleSelectionMode}
                                className={cn(
                                    "h-9 w-9 flex items-center justify-center rounded-lg transition-all border outline-none",
                                    isSelectionMode
                                        ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                                        : "bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
                                )}
                                title={isSelectionMode ? t('history_menu.cancel') : t('history_menu.select')}
                            >
                                <ListChecks className="w-5 h-5" />
                            </button>

                            {/* Sort Dropdown */}
                            <div className="relative shrink-0" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className={cn(
                                        "p-2 rounded-lg border transition-all text-muted-foreground hover:text-foreground",
                                        showMenu ? "bg-secondary text-foreground border-border/50" : "border-transparent hover:bg-secondary/50"
                                    )}
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-card/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 p-1.5">
                                        <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">Sort By</div>
                                        {['date', 'size'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    if (filterType === type) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
                                                    else setFilterType(type)
                                                }}
                                                className={cn("flex w-full items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors capitalize", filterType === type ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted")}
                                            >
                                                {type}
                                                <div className="flex items-center">
                                                    {filterType === type && sortOrder === 'asc' && <ArrowUp className="w-3 h-3 mr-1" />}
                                                    {filterType === type && sortOrder === 'desc' && <ArrowDown className="w-3 h-3 mr-1" />}
                                                    {filterType === type && <CheckCircle2 className="w-3 h-3" />}
                                                </div>
                                            </button>
                                        ))}
                                        <div className="h-px bg-border/50 my-1" />
                                        <button onClick={handleVerifyFiles} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium hover:bg-muted rounded-lg">
                                            <RefreshCw className={cn("w-3.5 h-3.5", isVerifying && "animate-spin")} /> Verify Integrity
                                        </button>
                                        <button onClick={() => { if (confirm("Delete all?")) deleteHistory() }} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg">
                                            <Trash2 className="w-3.5 h-3.5" /> Delete History
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Selection Toolbar */}
                    {isSelectionMode && (
                        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg animate-in slide-in-from-top-2">
                            <span className="text-xs font-medium text-blue-500">
                                {t('history_menu.selected_count', { count: selectedIds.size }) || `${selectedIds.size} Selected`}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-xs font-medium px-3 py-1 hover:bg-blue-500/10 rounded text-blue-600 transition-colors">
                                    {selectedIds.size === historyTasks.length ? t('history_menu.deselect_all') : t('history_menu.select_all')}
                                </button>
                                <button
                                    onClick={deleteSelected}
                                    disabled={selectedIds.size === 0}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded font-bold shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    {t('history_menu.delete')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-background/30">
                <div className="pb-10 max-w-7xl mx-auto">
                    {historyTasks.length > 0 ? (
                        <div className="divide-y divide-border/50 border-t border-border/50">
                            {historyTasks.slice(0, visibleCount).map((task, idx) => (
                                <HistoryItem
                                    key={task.id}
                                    task={task}
                                    index={idx}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.has(task.id)}
                                    isMissing={missingFileIds.has(task.id)}
                                    onToggleSelect={toggleSelect}
                                    onPlay={handlePlayFile}
                                    onOpenFolder={handleOpenFolder}
                                    onRemove={handleRemove}
                                    onRetry={handleRetry}
                                    onCompress={handleCompress}
                                    onViewCommand={handleViewCommand}
                                    language={language}
                                    t={t}
                                    developerMode={settings.developerMode}
                                />
                            ))}

                            {/* Load More */}
                            {historyTasks.length > visibleCount && (
                                <div className="p-8 flex justify-center">
                                    <button
                                        onClick={() => setVisibleCount(prev => prev + 20)}
                                        className="px-6 py-2 bg-secondary/50 hover:bg-secondary text-sm font-medium rounded-full transition-colors backdrop-blur-md"
                                    >
                                        Load More ({historyTasks.length - visibleCount})
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground animate-in fade-in duration-500">
                            <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
                                <LayoutGrid className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-lg font-medium opacity-50">{t('history.empty')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {selectedTask && (
                <CommandModal
                    task={selectedTask}
                    isOpen={isCommandOpen}
                    onClose={() => setIsCommandOpen(false)}
                />
            )}
            <CompressDialog
                isOpen={isCompressOpen}
                onClose={() => setIsCompressOpen(false)}
                task={compressTask}
                onCompress={(taskId, options) => {
                    if (compressTask) useAppStore.getState().compressTask(taskId, options)
                }}
            />
        </div>
    )
}
