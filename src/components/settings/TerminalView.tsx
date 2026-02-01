import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Trash2, Copy, Filter, Check, Terminal, Cpu, Scissors, FolderOpen, Search, Download, Bug, AlertTriangle, AlertCircle, Info, CheckCircle2, Globe, ChevronRight } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '../../store'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { notify } from '../../lib/notify'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'
import { LogEntry, LogLevel } from '../../store/slices/types'

type LogSourceFilter = 'all' | 'system' | 'ytdlp' | 'ffmpeg' | 'ui'
type LogLevelFilter = 'all' | LogLevel

export function TerminalView() {
    const { t } = useTranslation()
    const { logs, clearLogs } = useAppStore()
    const endRef = useRef<HTMLDivElement>(null)
    const [sourceFilter, setSourceFilter] = useState<LogSourceFilter>('all')
    const [levelFilter, setLevelFilter] = useState<LogLevelFilter>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [copied, setCopied] = useState(false)
    const [autoScroll, setAutoScroll] = useState(true)

    // Filter logs based on selected filters
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSource = sourceFilter === 'all' || log.source === sourceFilter
            const matchesLevel = levelFilter === 'all' || log.level === levelFilter
            const matchesSearch = searchQuery === '' ||
                (log.message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.context || '').toLowerCase().includes(searchQuery.toLowerCase())

            return matchesSource && matchesLevel && matchesSearch
        })
    }, [logs, sourceFilter, levelFilter, searchQuery])

    useEffect(() => {
        if (autoScroll) {
            endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [filteredLogs.length, autoScroll])

    const handleCopyAll = async () => {
        try {
            const content = filteredLogs.map(l =>
                `[${new Date(l.timestamp).toLocaleString()}] [${l.level.toUpperCase()}] [${l.source.toUpperCase()}] ${l.message || ''}${l.context ? `\nContext: ${l.context}` : ''}${l.stackTrace ? `\nStack: ${l.stackTrace}` : ''}`
            ).join('\n')
            await writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e: unknown) {
            console.error('Failed to copy:', e)
            notify.error(t('errors.copy_logs'), { description: e instanceof Error ? e.message : undefined })
        }
    }

    const handleSaveToFile = async () => {
        try {
            const path = await save({
                filters: [{ name: 'Log Files', extensions: ['txt', 'log'] }],
                defaultPath: `sceneclip_logs_${new Date().toISOString().split('T')[0]}.txt`
            })

            if (path) {
                const content = filteredLogs.map(l =>
                    `[${new Date(l.timestamp).toLocaleString()}] [${l.level.toUpperCase()}] [${l.source.toUpperCase()}] ${l.message || ''}${l.context ? `\nContext: ${l.context}` : ''}${l.stackTrace ? `\nStack: ${l.stackTrace}` : ''}`
                ).join('\n')
                await writeTextFile(path as string, content)
                notify.success("Logs exported successfully!")
            }
        } catch (e) {
            console.error('Failed to save logs:', e)
            notify.error("Failed to export logs", { description: e instanceof Error ? e.message : String(e) })
        }
    }

    const handleOpenLogs = async () => {
        try {
            await invoke('open_log_dir')
        } catch (e) {
            console.error('Failed to open log dir:', e)
            notify.error("Failed to open logs", { description: e instanceof Error ? e.message : String(e) })
        }
    }

    const sourceFilterButtons = useMemo(() => {
        return [
            { id: 'all', label: t('terminal.filter_all') || 'All', icon: Terminal },
            { id: 'system', label: t('terminal.filter_system') || 'System', icon: Cpu },
            { id: 'ytdlp', label: t('terminal.filter_ytdlp') || 'yt-dlp', icon: Terminal },
            { id: 'ffmpeg', label: t('terminal.filter_ffmpeg') || 'FFmpeg', icon: Scissors },
            { id: 'ui', label: 'UI', icon: Globe },
        ] as const
    }, [t])

    const levelFilterButtons = [
        { id: 'all', label: 'All', color: '' },
        { id: 'error', label: 'Error', color: 'text-red-500' },
        { id: 'warning', label: 'Warn', color: 'text-yellow-500' },
        { id: 'info', label: 'Info', color: 'text-blue-500' },
        { id: 'success', label: 'Success', color: 'text-emerald-500' },
        { id: 'debug', label: 'Debug', color: 'text-purple-500' },
        { id: 'trace', label: 'Trace', color: 'text-zinc-500' },
    ] as const

    return (
        <div className="flex flex-col h-full bg-[#09090b] dark:bg-black/90 text-zinc-300 font-mono text-xs rounded-lg shadow-md border border-zinc-300 dark:border-white/10 overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 p-2 border-b border-white/10 bg-black/50 shrink-0">
                <div className="flex items-center justify-between">
                    {/* Source Filters */}
                    <div className="flex items-center gap-1">
                        <Filter className="w-3 h-3 text-zinc-500 mr-1" />
                        {sourceFilterButtons.map(btn => (
                            <Button
                                key={btn.id}
                                variant="ghost"
                                onClick={() => setSourceFilter(btn.id)}
                                className={`
                                    h-auto px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1
                                    ${sourceFilter === btn.id
                                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }
                                `}
                            >
                                <btn.icon className="w-3 h-3" />
                                {btn.label}
                            </Button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-600 mr-2">
                            {filteredLogs.length} / {logs.length}
                        </span>

                        <div className="flex items-center bg-zinc-900 rounded border border-white/5 mr-2">
                            <button
                                onClick={() => setAutoScroll(!autoScroll)}
                                className={`px-2 py-1 text-[10px] rounded transition-colors ${autoScroll ? 'bg-primary/20 text-primary' : 'text-zinc-500'}`}
                            >
                                Auto-Scroll
                            </button>
                        </div>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={handleCopyAll}
                                        className="p-1.5 hover:bg-white/10 rounded flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('terminal.copy_all') || "Copy All"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={handleSaveToFile}
                                        className="p-1.5 hover:bg-white/10 rounded flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Export to File</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={handleOpenLogs}
                                        className="p-1.5 hover:bg-white/10 rounded flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Open Log Folder</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={clearLogs}
                                        className="p-1.5 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('terminal.clear_all') || "Clear All"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Level Filters */}
                    <div className="flex items-center gap-1">
                        {levelFilterButtons.map(btn => (
                            <button
                                key={btn.id}
                                onClick={() => setLevelFilter(btn.id)}
                                className={`
                                    px-2 py-0.5 rounded text-[10px] transition-all border
                                    ${levelFilter === btn.id
                                        ? 'bg-white/10 border-white/20 text-white font-bold'
                                        : `border-transparent opacity-60 hover:opacity-100 ${btn.color}`
                                    }
                                `}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex-1 relative group">
                        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded py-1 pl-7 pr-2 outline-none focus:border-primary/30 focus:bg-zinc-900 transition-all text-[10px]"
                        />
                    </div>
                </div>
            </div>

            {/* Log Content */}
            <div className="flex-1 overflow-auto p-3 space-y-1">
                {filteredLogs.length === 0 && (
                    <div className="text-zinc-500 italic text-center py-8 flex flex-col items-center gap-2">
                        <Terminal className="w-8 h-8 opacity-20" />
                        <p>
                            {searchQuery || sourceFilter !== 'all' || levelFilter !== 'all'
                                ? "No matching logs found."
                                : (t('terminal.ready') || "System ready. Waiting for tasks...")}
                        </p>
                    </div>
                )}
                {filteredLogs.map((log) => (
                    <MemoizedLogItem
                        key={log.id}
                        log={log}
                    />
                ))}
                <div ref={endRef} />
            </div>
        </div>
    )
}

// Memoized Log Item to prevent unnecessary re-renders
const MemoizedLogItem = React.memo(({ log }: { log: LogEntry }) => {
    const { t } = useTranslation()
    const [expanded, setExpanded] = useState(false)

    const levelInfo = {
        error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
        warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        debug: { icon: Bug, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        trace: { icon: Terminal, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
    }

    const { icon: LevelIcon, color: levelColor, bg: levelBg } = levelInfo[log.level] || levelInfo.info

    // Syntax highlighting logic
    const highlightedMessage = useMemo(() => {
        const msg = log.translationKey ? t(log.translationKey, log.params) : (log.message || '')

        // SECURITY: Escape HTML
        let result = msg
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')

        // Apply coloring replacements
        result = result
            .replace(/(https?:\/\/[^\s]+)/g, '<span class="text-blue-400 underline decoration-blue-400/30 cursor-pointer">$1</span>')
            .replace(/(--[\w-]+)/g, '<span class="text-zinc-400 font-bold">$1</span>')
            .replace(/(\d+\.?\d*%)/g, '<span class="text-yellow-400 font-bold">$1</span>')
            .replace(/(\d+\.?\d*\s?[KMG]i?B\/s)/gi, '<span class="text-cyan-400">$1</span>')
            .replace(/(ETA\s+[\d:]+|in\s+[\d:]+|\d+:\d{2}:\d{2}|\d{2}:\d{2})/g, '<span class="text-purple-400">$1</span>')
            .replace(/^(System:)/gm, '<span class="text-orange-400 font-bold">$1</span>')
            .replace(/(\[[^\]]+\])/g, '<span class="text-zinc-500">$1</span>')

        return result
    }, [log.message, log.translationKey, log.params, t])

    const handleCopyLine = async () => {
        try {
            const msg = log.translationKey ? t(log.translationKey, log.params) : (log.message || '')
            const content = `[${new Date(log.timestamp).toLocaleString()}] [${log.level.toUpperCase()}] ${msg}${log.context ? `\nContext: ${log.context}` : ''}`
            await writeText(content)
            notify.success("Copied to clipboard")
        } catch (e) {
            console.error('Failed to copy line:', e)
        }
    }

    const hasExtra = !!(log.context || log.stackTrace)

    return (
        <div className={`group flex flex-col border-b border-white/5 pb-1 rounded hover:bg-white/[0.03] transition-colors relative ${expanded ? 'bg-white/[0.02]' : ''}`}>
            <div className="flex gap-2 items-start py-0.5 px-1 min-h-[24px]">
                {/* Level Tag/Icon */}
                <div className={`shrink-0 flex items-center justify-center w-4 h-4 rounded ${levelBg} mt-0.5`}>
                    <LevelIcon className={`w-2.5 h-2.5 ${levelColor}`} />
                </div>

                {/* Timestamp */}
                <span className="text-zinc-600 shrink-0 select-none tabular-nums pt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>

                {/* Source */}
                <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-500 shrink-0 select-none mt-0.5 border border-white/5">
                    {log.source.toUpperCase()}
                </span>

                {/* Message */}
                <div className="flex-1 break-all whitespace-pre-wrap pt-0.5">
                    <span dangerouslySetInnerHTML={{ __html: highlightedMessage }} />

                    {hasExtra && !expanded && (
                        <button
                            onClick={() => setExpanded(true)}
                            className="ml-2 px-1 rounded bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-[9px] border border-white/5"
                        >
                            + Details
                        </button>
                    )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    onClick={handleCopyLine}
                                    className="h-6 w-6 p-0 hover:bg-white/10"
                                >
                                    <Copy className="w-3 h-3 text-zinc-500" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Copy line</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {hasExtra && (
                        <Button
                            variant="ghost"
                            onClick={() => setExpanded(!expanded)}
                            className={`h-6 w-6 p-0 hover:bg-white/10 ${expanded ? 'text-primary' : 'text-zinc-500'}`}
                        >
                            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-10 pb-2 flex flex-col gap-2 animate-in slide-in-from-top-1 duration-200">
                    {log.context && (
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                                <Info className="w-3 h-3" /> CONTEXT
                            </span>
                            <div className="bg-black/40 p-2 rounded border border-white/5 text-zinc-400 italic">
                                {log.context}
                            </div>
                        </div>
                    )}

                    {log.stackTrace && (
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-red-500/70 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-red-500" /> STACK TRACE
                            </span>
                            <div className="bg-red-500/5 p-2 rounded border border-red-500/10 text-red-400/80 text-[10px] leading-relaxed">
                                {log.stackTrace}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setExpanded(false)}
                        className="text-[10px] text-zinc-600 hover:text-zinc-400 w-fit"
                    >
                        Hide details
                    </button>
                </div>
            )}
        </div>
    )
}, (prev, next) => {
    return prev.log.id === next.log.id &&
        prev.log.message === next.log.message &&
        prev.log.level === next.log.level &&
        prev.log.translationKey === next.log.translationKey
})
