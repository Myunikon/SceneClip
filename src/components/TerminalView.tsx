import { useRef, useEffect, useState, useMemo } from 'react'
import { Trash2, Copy, Filter, Check, Terminal, Cpu, Scissors } from 'lucide-react'
import { useAppStore } from '../store'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

type LogFilter = 'all' | 'system' | 'ytdlp' | 'ffmpeg'

export function TerminalView() {
    const { logs, clearLogs } = useAppStore()
    const endRef = useRef<HTMLDivElement>(null)
    const [filter, setFilter] = useState<LogFilter>('all')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, [logs])

    // Filter logs based on selected filter
    const filteredLogs = useMemo(() => {
        if (filter === 'all') return logs
        return logs.filter(log => {
            const lower = log.message.toLowerCase()
            switch (filter) {
                case 'system':
                    return lower.includes('system:') || lower.includes('[system]') || 
                           lower.includes('store') || lower.includes('binary') ||
                           lower.includes('ready') || lower.includes('error')
                case 'ytdlp':
                    return lower.includes('yt-dlp') || lower.includes('ytdlp') || 
                           lower.includes('[download]') || lower.includes('[info]') ||
                           lower.includes('downloading') || lower.includes('eta') ||
                           lower.includes('speed') || lower.includes('%')
                case 'ffmpeg':
                    return lower.includes('ffmpeg') || lower.includes('merge') || 
                           lower.includes('muxing') || lower.includes('video:') ||
                           lower.includes('audio:')
                default:
                    return true
            }
        })
    }, [logs, filter])

    const handleCopyAll = async () => {
        try {
            await writeText(filteredLogs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.message}`).join('\n'))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error('Failed to copy:', e)
        }
    }

    const handleCopyLine = async (log: { message: string, timestamp: number }) => {
        try {
            await writeText(`[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`)
        } catch (e) {
            console.error('Failed to copy line:', e)
        }
    }

    // Syntax highlighting for log entries
    const highlightLog = (log: string) => {
        // Apply various highlights
        // SECURITY: Escape HTML to prevent XSS before adding our own spans
        let result = log
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
        
        // URLs - blue
        result = result.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<span class="text-blue-400">$1</span>'
        )
        
        // Arguments (--something) - green
        result = result.replace(
            /(--[\w-]+)/g, 
            '<span class="text-green-400">$1</span>'
        )
        
        // Percentages - yellow
        result = result.replace(
            /(\d+\.?\d*%)/g, 
            '<span class="text-yellow-400 font-bold">$1</span>'
        )
        
        // Speed values - cyan
        result = result.replace(
            /(\d+\.?\d*\s?[KMG]i?B\/s)/gi, 
            '<span class="text-cyan-400">$1</span>'
        )
        
        // Time values (ETA, duration) - purple
        result = result.replace(
            /(ETA\s+[\d:]+|in\s+[\d:]+|\d+:\d{2}:\d{2}|\d{2}:\d{2})/g, 
            '<span class="text-purple-400">$1</span>'
        )
        
        // Error keywords - red
        result = result.replace(
            /(error|failed|exception|warning)/gi, 
            '<span class="text-red-400 font-bold">$1</span>'
        )
        
        // Success keywords - green bright
        result = result.replace(
            /(success|completed|done|finished|100%)/gi, 
            '<span class="text-emerald-400 font-bold">$1</span>'
        )
        
        // System prefix - orange
        result = result.replace(
            /^(System:)/gm, 
            '<span class="text-orange-400 font-bold">$1</span>'
        )
        
        // [download], [info], etc brackets - dim
        result = result.replace(
            /(\[[^\]]+\])/g, 
            '<span class="text-gray-500">$1</span>'
        )

        return result
    }

    const filterButtons = [
        { id: 'all', label: 'All', icon: Terminal },
        { id: 'system', label: 'System', icon: Cpu },
        { id: 'ytdlp', label: 'yt-dlp', icon: Terminal },
        { id: 'ffmpeg', label: 'FFmpeg', icon: Scissors },
    ] as const

    return (
        <div className="flex flex-col h-full bg-black/90 text-green-400 font-mono text-xs rounded-lg shadow-inner border border-white/10 overflow-hidden relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b border-white/10 bg-black/50 shrink-0">
                {/* Filter Buttons */}
                <div className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-gray-500 mr-1" />
                    {filterButtons.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setFilter(btn.id)}
                            className={`
                                px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1
                                ${filter === btn.id 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }
                            `}
                        >
                            <btn.icon className="w-3 h-3" />
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600">
                        {filteredLogs.length} / {logs.length}
                    </span>
                    <button 
                        onClick={handleCopyAll} 
                        className="p-1.5 hover:bg-white/10 rounded flex items-center gap-1 text-gray-400 hover:text-white transition-colors" 
                        title="Copy All"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button 
                        onClick={clearLogs} 
                        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors" 
                        title="Clear All"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Log Content */}
            <div className="flex-1 overflow-auto p-3 space-y-0.5">
                {filteredLogs.length === 0 && (
                    <div className="text-gray-500 italic text-center py-8">
                        {filter === 'all' 
                            ? 'System ready. Waiting for tasks...' 
                            : `No ${filter} logs found.`}
                    </div>
                )}
                {filteredLogs.slice(-500).map((log, i) => (
                    <div 
                        key={i} 
                        className="group break-all whitespace-pre-wrap border-b border-white/5 pb-0.5 font-mono hover:bg-white/5 px-1 -mx-1 rounded relative flex gap-2"
                    >
                        <span className="text-gray-600 shrink-0 select-none">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span>
                            <span dangerouslySetInnerHTML={{ __html: highlightLog(log.message) }} />
                        </span>
                        
                        <button
                            onClick={() => handleCopyLine(log)}
                            className="absolute right-1 top-0.5 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-opacity"
                            title="Copy line"
                        >
                            <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    )
}
