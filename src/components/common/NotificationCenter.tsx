import { useState, useRef, useEffect } from 'react'
import { Bell, X, Trash2, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { useAppStore } from '../../store'
import { translations } from '../../lib/locales'

// Log message parser removed in favor of structured LogEntry


const typeStyles = {
    success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    info: { icon: Info, color: 'text-orange-400', bg: 'bg-orange-500/10' },
}

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const { logs, clearLogs, settings } = useAppStore()
    const popoverRef = useRef<HTMLDivElement>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (translations[settings.language as keyof typeof translations] || translations['en']) as any

    // Only show last 50 logs, most recent first
    // Filter out 'info' logs (debug/verbose) and map strictly to "important" events
    const logsWithIndex = logs.map((log, idx) => ({ ...log, originalIndex: idx }))
    const recentLogs = logsWithIndex
        .filter(log => log.type !== 'info') // User req: only important events (error, warning, success)
        .reverse()
        .slice(0, 50)

    const unreadCount = recentLogs.length // Show count of filtered important logs only? Or all? User likely cares about important ones.

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClick)
        }
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen])

    // Format timestamp
    const formatTime = (ts: number) => {
        const date = new Date(ts)
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()
        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="relative" ref={popoverRef}>
            {/* Bell Button */}
            {/* Bell Button */}
            <TooltipProvider>
                <Tooltip side="bottom-end">
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="relative p-1.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                        >
                            <Bell className={`w-4 h-4 ${isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 animate-in zoom-in duration-200">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t.notifications?.title || "Notifications"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Popover */}
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-80 max-h-[400px] bg-background/60 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden animate-in slide-in-from-bottom-2 duration-300 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                        <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5" />
                            {t.notifications?.title || "Notifications"}
                            {unreadCount > 0 && (
                                <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-1">
                            {logs.length > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={clearLogs}
                                                className="p-1.5 text-muted-foreground/70 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-background/80 backdrop-blur-xl border-white/10">
                                            <p>{t.notifications?.clear_all || "Clear All"}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-muted-foreground/70 hover:text-foreground hover:bg-white/5 rounded-md transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[320px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {recentLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
                                <Bell className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-xs font-medium">{t.notifications?.empty || "No notifications"}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {recentLogs.map((log) => {
                                    const style = typeStyles[log.type] || typeStyles.info
                                    const Icon = style.icon

                                    // Localization Handling
                                    let message = log.message || ''
                                    if (log.translationKey && t.logs?.[log.translationKey]) {
                                        message = t.logs[log.translationKey]
                                        if (log.params) {
                                            Object.entries(log.params).forEach(([k, v]) => {
                                                message = message.replace(`{{${k}}}`, String(v))
                                            })
                                        }
                                    }

                                    return (
                                        <div
                                            key={log.originalIndex}
                                            className={`px-4 py-3 hover:bg-white/5 transition-colors group/item relative pr-8`}
                                        >
                                            <div className="flex gap-3 items-start">
                                                <div className={`mt-0.5 p-1 rounded-full ${style.bg.replace('/10', '/20')}`}>
                                                    <Icon className={`w-3 h-3 ${style.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-foreground/90 break-words leading-relaxed font-medium">
                                                        {message}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                                                        {formatTime(log.timestamp)}
                                                    </p>
                                                </div>
                                            </div>

                                            <TooltipProvider delayDuration={500}>
                                                <Tooltip side="left">
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                useAppStore.getState().removeLog(log.originalIndex);
                                                            }}
                                                            className="absolute top-3 right-2 p-1 text-muted-foreground/30 hover:text-foreground hover:bg-white/10 rounded-full opacity-0 group-hover/item:opacity-100 transition-all scale-90 hover:scale-100"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-background/80 backdrop-blur-xl border-white/10">
                                                        <p>Dismiss</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    )
                                })}

                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
