import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { notify } from '../../lib/notify'
import { useAppStore, DownloadTask } from '../../store'
import { useShallow } from 'zustand/react/shallow'
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

import { CommandModal } from '../dialogs'
import { CompressDialog } from '../dialogs'
import { parseSize, cn } from '../../lib/utils'
import { SegmentedControl } from '../ui'
import { HistoryItem } from './HistoryItem'


export function HistoryView() {
    const { tasks, deleteHistory, clearTask, retryTask, retryAllFailed, recoverDownloads, getInterruptedCount, settings } = useAppStore(
        useShallow((s) => ({
            tasks: s.tasks,
            deleteHistory: s.deleteHistory,
            clearTask: s.clearTask,
            retryTask: s.retryTask,
            retryAllFailed: s.retryAllFailed,
            recoverDownloads: s.recoverDownloads,
            getInterruptedCount: s.getInterruptedCount,
            settings: s.settings
        }))
    )
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
        const allTasks = [...realTasks] // Purely real tasks

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
