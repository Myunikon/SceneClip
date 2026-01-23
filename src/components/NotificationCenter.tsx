import { useState, useRef, useEffect } from 'react'
import { Bell, X, Trash2, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../store'
import { translations } from '../lib/locales'

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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                title={t.notifications?.title || "Notifications"}
            >
                <Bell className={`w-4 h-4 ${isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 animate-in zoom-in duration-200">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-80 max-h-[400px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary" />
                            {t.notifications?.title || "Notifications"}
                            {logs.length > 0 && (
                                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                                    {logs.length}
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-1">
                            {logs.length > 0 && (
                                <button
                                    onClick={clearLogs}
                                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title={t.notifications?.clear_all || "Clear All"}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[320px]">
                        {recentLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <Bell className="w-10 h-10 opacity-30 mb-2" />
                                <p className="text-sm">{t.notifications?.empty || "No notifications yet"}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
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
                                            className={`px-4 py-3 hover:bg-secondary/30 transition-colors ${style.bg} group/item relative pr-8`}
                                        >
                                            <div className="flex gap-3">
                                                <Icon className={`w-4 h-4 ${style.color} shrink-0 mt-0.5`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-foreground break-words leading-relaxed">
                                                        {message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatTime(log.timestamp)}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    useAppStore.getState().removeLog(log.originalIndex);
                                                }}
                                                className="absolute top-3 right-2 p-1 text-muted-foreground/50 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 rounded-full opacity-0 group-hover/item:opacity-100 transition-all"
                                                title="Dismiss"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
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
