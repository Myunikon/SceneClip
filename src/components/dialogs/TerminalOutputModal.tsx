import { createPortal } from 'react-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { SquareTerminal, X, Copy, Check, Trash2, ArrowDown } from 'lucide-react'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { motion, AnimatePresence } from 'framer-motion'
import { listen } from '@tauri-apps/api/event'
import { DownloadTask } from '../../store/slices/types'
import { useTranslation } from 'react-i18next'

interface TaskOutputEvent {
    taskId: string
    line: string
    level: string // 'stdout' | 'stderr' | 'info' | 'warning' | 'error'
    isReplace?: boolean
}

interface TerminalLine {
    id: number
    text: string
    level: string
    timestamp: number
}

interface TerminalOutputModalProps {
    task: DownloadTask
    isOpen: boolean
    onClose: () => void
}

const MAX_LINES = 500

export function TerminalOutputModal({
    task,
    isOpen,
    onClose
}: TerminalOutputModalProps) {
    const { t } = useTranslation()
    const [lines, setLines] = useState<TerminalLine[]>([])
    const [copied, setCopied] = useState(false)
    const [autoScroll, setAutoScroll] = useState(true)
    const [isLive, setIsLive] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const lineIdRef = useRef(0)
    const liveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

    // Subscribe to task_output events
    useEffect(() => {
        if (!isOpen) return

        const unlisten = listen<TaskOutputEvent>('task_output', (event) => {
            const data = event.payload
            if (data.taskId !== task.id) return

            // Pulse live indicator
            setIsLive(true)
            if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current)
            liveTimeoutRef.current = setTimeout(() => setIsLive(false), 1500)

            setLines(prev => {
                // Skip 'info' level for lines that were already sent as 'stdout'
                if (data.level === 'info' && prev.length > 0) {
                    const last = prev[prev.length - 1]
                    if (last && last.text === data.line && last.level === 'stdout') {
                        return prev // Skip duplicate
                    }
                }
                
                // VT100 Carriage Return equivalent
                if (data.isReplace && prev.length > 0) {
                    const newLines = [...prev]
                    newLines[newLines.length - 1] = {
                        ...newLines[newLines.length - 1],
                        text: data.line,
                        level: data.level,
                        timestamp: Date.now()
                    }
                    return newLines
                }

                const newLine: TerminalLine = {
                    id: lineIdRef.current++,
                    text: data.line,
                    level: data.level,
                    timestamp: Date.now()
                }
                const updated = [...prev, newLine]
                // Cap at MAX_LINES to prevent memory bloat
                if (updated.length > MAX_LINES) {
                    return updated.slice(updated.length - MAX_LINES)
                }
                return updated
            })
        })

        return () => {
            unlisten.then(fn => fn())
            if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current)
        }
    }, [isOpen, task.id])

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [lines, autoScroll])

    // Detect manual scroll (user scrolls up → disable auto-scroll)
    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 40
        setAutoScroll(isAtBottom)
    }, [])

    const scrollToBottom = () => {
        setAutoScroll(true)
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }

    const copyAll = async () => {
        const text = lines.map(l => l.text).join('\n')
        try {
            await writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error('Failed to copy:', e)
        }
    }

    const clearLines = () => {
        setLines([])
        lineIdRef.current = 0
    }

    const getLineColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-600 dark:text-red-400'
            case 'warning': return 'text-amber-600 dark:text-amber-400'
            case 'stderr': return 'text-orange-600/80 dark:text-orange-300/80'
            case 'stdout': return 'text-gray-700 dark:text-gray-300'
            case 'info': return 'text-sky-600/80 dark:text-sky-300/70'
            default: return 'text-gray-700 dark:text-gray-300'
        }
    }

    const getStreamPrefix = (level: string) => {
        switch (level) {
            case 'stderr': return '<span class="text-orange-600/70 dark:text-orange-500/50 font-bold mr-2">err│</span>'
            case 'error': return '<span class="text-red-600/80 dark:text-red-500/70 font-bold mr-2">ERR│</span>'
            default: return ''
        }
    }

    const highlightLine = (text: string) => {
        if (!text) return ''
        return text
            // Highlight arguments like --flag
            .replace(/(--[\w-]+)/g, '<span class="text-green-600 dark:text-green-400">$1</span>')
            // Highlight URLs
            .replace(/(https?:\/\/[^\s]+)/g, '<span class="text-blue-600 dark:text-blue-400 hover:underline">$1</span>')
            // Highlight percentages
            .replace(/(\d+(\.\d+)?%)/g, '<span class="text-emerald-600 dark:text-emerald-400 font-bold">$1</span>')
            // Highlight speeds like 1.5MiB/s
            .replace(/(\d+\.?\d*\s?[KMG]i?B\/s)/gi, '<span class="text-cyan-600 dark:text-cyan-400">$1</span>')
            // Highlight ETA patterns
            .replace(/(ETA\s+[\d:]+|in\s+[\d:]+|\d+:\d{2}:\d{2}|\d{2}:\d{2})/g, '<span class="text-amber-600 dark:text-amber-400">$1</span>')
            // Highlight quoted strings
            .replace(/("[^"]*")/g, '<span class="text-yellow-600 dark:text-yellow-400">$1</span>')
            // Highlight [ERROR] / [WARNING] prefixes
            .replace(/(\[ERROR\])/g, '<span class="text-red-600 dark:text-red-400 font-bold">$1</span>')
            .replace(/(\[WARNING\])/g, '<span class="text-amber-600 dark:text-amber-400 font-bold">$1</span>')
            .replace(/(\[Process\])/g, '<span class="text-purple-600 dark:text-purple-400 font-bold">$1</span>')
    }

    if (!isOpen) return null

    const modalContent = (
        <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-white/85 dark:bg-[#1a1a2e]/85 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <SquareTerminal className="w-5 h-5 text-gray-700 dark:text-emerald-400" />
                        {/* Live indicator */}
                        {isLive && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {t('common.view_terminal', 'Live Terminal')}
                    </h3>
                    {/* Active status badge */}
                    {['downloading', 'processing', 'fetching_info', 'queued'].includes(task.status) && (
                        <span className="text-[11px] font-medium bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Copy All */}
                    <button
                        onClick={copyAll}
                        disabled={lines.length === 0}
                        className="text-xs font-medium flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? t('terminal.copied', 'Copied!') : t('terminal.copy_all', 'Copy All')}
                    </button>
                    {/* Clear */}
                    <button
                        onClick={clearLines}
                        disabled={lines.length === 0}
                        className="text-xs font-medium flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('terminal.clear_all', 'Clear')}
                    </button>
                    {/* Close window control */}
                    <button onClick={onClose} aria-label="Close" className="p-1.5 ml-1 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Task Info Bar */}
            <div className="px-4 py-2 bg-gray-50/80 dark:bg-[#16162a]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 font-mono truncate">
                    <span className="text-gray-800 dark:text-gray-400 font-medium">{task.title || 'Unknown'}</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">•</span>
                    <span className="text-gray-500 dark:text-gray-600 select-all truncate">{task.url}</span>
                </div>
            </div>

            {/* Terminal Output */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="relative flex-1 overflow-auto bg-white dark:bg-[#0d0d1a] font-mono text-xs sm:text-sm leading-relaxed"
                style={{ maxHeight: '60vh', minHeight: '250px' }}
            >
                {lines.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[250px]">
                        <div className="text-center text-gray-400 dark:text-gray-600">
                            <SquareTerminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('terminal.no_output', 'Waiting for output...')}</p>
                            <p className="text-xs mt-1 opacity-60">
                                {t('terminal.no_output_hint', 'Output will appear here when the process starts')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 space-y-0 text-[11px] sm:text-[13px]">
                        {lines.map((line) => (
                            <div
                                key={line.id}
                                className={`group flex items-start gap-2 py-px hover:bg-gray-100/50 dark:hover:bg-white/[0.02] rounded-sm ${getLineColor(line.level)}`}
                            >
                                <span className="text-gray-400 dark:text-gray-700 select-none shrink-0 w-8 text-right tabular-nums">{line.id + 1}</span>
                                <span className="select-text break-all whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: getStreamPrefix(line.level) + highlightLine(line.text) }} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Scroll-to-bottom FAB */}
                {!autoScroll && lines.length > 0 && (
                    <button
                        onClick={scrollToBottom}
                        className="sticky bottom-4 left-1/2 -translate-x-1/2 ml-[calc(50%-16px)] w-8 h-8 rounded-full bg-white/90 dark:bg-emerald-500/20 border border-gray-200 dark:border-emerald-500/30 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-emerald-500/30 hover:scale-105 transition-all text-gray-700 dark:text-emerald-400 shadow-xl dark:shadow-md backdrop-blur-md"
                    >
                        <ArrowDown className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-white/5 bg-gray-50/90 dark:bg-[#16162a]/95 backdrop-blur-xl flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-600">
                    {lines.length} {lines.length === 1 ? 'line' : 'lines'}
                    {lines.length >= MAX_LINES && <span className="text-amber-600 dark:text-amber-500/60 ml-1">• Buffer full (oldest lines trimmed)</span>}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600">
                    💡 {t('terminal.dev_hint', 'Raw process output for debugging')}
                </p>
            </div>
        </>
    )

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/20 dark:bg-black/60 supports-[backdrop-filter]:backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                    className="bg-white/95 dark:bg-[#12122a] border border-gray-200/50 dark:border-white/10 w-full max-w-4xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-2xl relative z-10 overflow-hidden flex flex-col supports-[backdrop-filter]:backdrop-blur-2xl"
                >
                    {modalContent}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    )
}
