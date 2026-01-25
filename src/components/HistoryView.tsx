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
    ListChecks
} from 'lucide-react'
import { openPath } from '@tauri-apps/plugin-opener'
import { exists } from '@tauri-apps/plugin-fs'

import { CommandModal } from './CommandModal'
import { CompressDialog } from './CompressDialog'
import { parseSize, cn } from '../lib/utils'
import { SegmentedControl } from './ui/SegmentedControl'
import { HistoryItem } from './history/HistoryItem'

// --- Dummy Data (Preserve for Demo) ---
const DUMMY_TASKS: Partial<DownloadTask>[] = [
    {
        id: 'dummy-1',
        title: 'Amazing Nature 4K - Forest Sounds & River Relaxation',
        url: 'https://www.youtube.com/watch?v=nature1',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
        fileSize: '1.2 GB',
        format: 'Video',
        _options: { videoCodec: 'av1', container: 'mp4' },
        filePath: 'C:\\Downloads\\Nature_4K.mp4'
    },
    {
        id: 'dummy-2',
        title: 'Lofi Girl - Hip Hop Radio 24/7 (Beats to Relax/Study to)',
        url: 'https://www.youtube.com/watch?v=lofi1',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        fileSize: '150 MB',
        format: 'Audio',
        _options: { container: 'mp3', audioBitrate: '320' },
        filePath: 'C:\\Downloads\\Music\\Lofi_Girl.mp3'
    },
    {
        id: 'dummy-3',
        title: 'Funny 24 - Best Memes Compilation 2024',
        url: 'https://www.instagram.com/reel/meme1',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 5,
        fileSize: '45 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'C:\\Downloads\\Shorts\\Memes_2024.mp4'
    },
    {
        id: 'dummy-4',
        title: 'Tech Review: iPhone 16 Pro Max Unboxing',
        url: 'https://www.tiktok.com/@techreviewer/video/123456',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 12,
        fileSize: '85 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'C:\\Downloads\\TikTok\\iPhone16Review.mp4'
    },
    {
        id: 'dummy-5',
        title: 'Missing File Example - This file has been deleted',
        url: 'https://www.youtube.com/watch?v=deleted',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        fileSize: '250 MB',
        format: 'Video',
        _options: { videoCodec: 'vp9', container: 'webm' },
        filePath: 'C:\\Downloads\\Deleted_Video.webm'
    },
    {
        id: 'dummy-6',
        title: 'Coding Tutorial - React Hooks Explained in 100s',
        url: 'https://www.youtube.com/watch?v=coding1',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 25,
        fileSize: '12 MB',
        format: 'Video',
        range: '00:00 - 01:40',
        _options: { videoCodec: 'av1', container: 'mp4', rangeStart: '00:00', rangeEnd: '01:40' },
        filePath: 'C:\\Downloads\\Tutorials\\React_Hooks_Clip.mp4'
    },
    {
        id: 'dummy-7',
        title: 'Podcast: The Future of AI (Episode 42)',
        url: 'https://www.youtube.com/watch?v=podcast1',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
        fileSize: '85 MB',
        format: 'Audio',
        _options: { container: 'm4a', audioBitrate: '192' },
        filePath: 'C:\\Downloads\\Podcasts\\AI_Future_Ep42.m4a'
    },
    {
        id: 'dummy-8',
        title: 'Twitter/X Clip: SpaceX Starship Launch',
        url: 'https://x.com/SpaceX/status/123456789',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 50,
        fileSize: '55 MB',
        format: 'Video',
        _options: { videoCodec: 'h264', container: 'mp4' },
        filePath: 'C:\\Downloads\\SpaceX\\Launch.mp4'
    },
    {
        id: 'dummy-9',
        title: 'Clipped: Funny Moment from Live Stream',
        url: 'https://www.facebook.com/watch/?v=123',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
        fileSize: '8.5 MB',
        format: 'Video',
        range: '10:05 - 10:25',
        _options: { videoCodec: 'h264', container: 'mp4', rangeStart: '10:05', rangeEnd: '10:25' },
        filePath: 'C:\\Downloads\\Clips\\Funny_Stream_Clip.mp4'
    },
    {
        id: 'dummy-10',
        title: 'Old Archived Video - File Missing',
        url: 'https://www.youtube.com/watch?v=old1',
        status: 'completed',
        completedAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
        fileSize: '1.5 GB',
        format: 'Video',
        _options: { videoCodec: 'av1', container: 'mkv' },
        filePath: 'C:\\Downloads\\Archived\\Old_Video.mkv'
    }
]

export function HistoryView() {
    const { tasks, deleteHistory, clearTask, retryTask, settings } = useAppStore()
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

                        {/* Spacer or additional header actions if needed */}
                        <div />
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
