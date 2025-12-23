import { useState } from 'react'
import { Pause, Play, StopCircle, Trash2, FolderOpen, RefreshCcw, Terminal, X, Copy, Check } from 'lucide-react'
import { openPath } from '@tauri-apps/plugin-opener'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { cn } from '../../lib/utils'
import { StatusBadge } from './StatusBadge'
import { DownloadTask } from '../../store/slices/types'
import { useAppStore } from '../../store'
import { motion, AnimatePresence } from 'framer-motion'

interface DownloadItemProps {
    task: DownloadTask
    t: any
}

// Command Modal Component
function CommandModal({ 
    task, 
    isOpen, 
    onClose 
}: { 
    task: DownloadTask
    isOpen: boolean
    onClose: () => void 
}) {
    const [copiedYtdlp, setCopiedYtdlp] = useState(false)
    const [copiedFfmpeg, setCopiedFfmpeg] = useState(false)

    const copyCommand = async (cmd: string, type: 'ytdlp' | 'ffmpeg') => {
        try {
            await writeText(cmd)
            if (type === 'ytdlp') {
                setCopiedYtdlp(true)
                setTimeout(() => setCopiedYtdlp(false), 2000)
            } else {
                setCopiedFfmpeg(true)
                setTimeout(() => setCopiedFfmpeg(false), 2000)
            }
        } catch (e) {
            console.error('Failed to copy:', e)
        }
    }

    // Syntax highlight command
    const highlightCommand = (cmd: string) => {
        if (!cmd) return ''
        let result = cmd
        // Arguments - green
        result = result.replace(/(--[\w-]+)/g, '<span class="text-green-400">$1</span>')
        // URLs - blue
        result = result.replace(/(https?:\/\/[^\s]+)/g, '<span class="text-blue-400">$1</span>')
        // Quotes - yellow
        result = result.replace(/("[^"]*")/g, '<span class="text-yellow-400">$1</span>')
        return result
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-purple-400" />
                                <h3 className="font-bold">Command Details</h3>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4 max-h-[60vh] overflow-auto">
                            {/* Task Info */}
                            <div className="bg-secondary/30 p-3 rounded-lg">
                                <div className="text-xs text-muted-foreground uppercase font-semibold">Task</div>
                                <div className="font-medium truncate">{task.title || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground font-mono truncate">{task.url}</div>
                            </div>

                            {/* yt-dlp Command */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold uppercase text-green-400 flex items-center gap-1">
                                        <Terminal className="w-3 h-3" /> yt-dlp Command
                                    </label>
                                    <button
                                        onClick={() => task.ytdlpCommand && copyCommand(task.ytdlpCommand, 'ytdlp')}
                                        disabled={!task.ytdlpCommand}
                                        className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-secondary rounded transition-colors disabled:opacity-50"
                                    >
                                        {copiedYtdlp ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                        {copiedYtdlp ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <div className="bg-black/80 p-3 rounded-lg border border-white/10 font-mono text-xs overflow-x-auto">
                                    {task.ytdlpCommand ? (
                                        <code 
                                            className="text-gray-300 whitespace-pre-wrap break-all"
                                            dangerouslySetInnerHTML={{ __html: highlightCommand(task.ytdlpCommand) }}
                                        />
                                    ) : (
                                        <span className="text-gray-500 italic">No command recorded</span>
                                    )}
                                </div>
                            </div>

                            {/* FFmpeg Command (if exists) */}
                            {task.ffmpegCommand && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold uppercase text-orange-400 flex items-center gap-1">
                                            <Terminal className="w-3 h-3" /> FFmpeg Command
                                        </label>
                                        <button
                                            onClick={() => task.ffmpegCommand && copyCommand(task.ffmpegCommand, 'ffmpeg')}
                                            className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-secondary rounded transition-colors"
                                        >
                                            {copiedFfmpeg ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                            {copiedFfmpeg ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="bg-black/80 p-3 rounded-lg border border-white/10 font-mono text-xs overflow-x-auto">
                                        <code 
                                            className="text-gray-300 whitespace-pre-wrap break-all"
                                            dangerouslySetInnerHTML={{ __html: highlightCommand(task.ffmpegCommand) }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-border bg-secondary/20 text-center">
                            <p className="text-[10px] text-muted-foreground">
                                💡 Copy these commands to run manually in your terminal
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

export function DownloadItem({ task, t }: DownloadItemProps) {
    const { pauseTask, stopTask, resumeTask, retryTask, clearTask, settings } = useAppStore()
    const [showCommandModal, setShowCommandModal] = useState(false)

    return (
        <>
            <div className="bg-card border rounded-xl p-4 md:px-4 md:py-3 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-[3fr_100px_3fr_auto] gap-4 items-center group relative overflow-hidden">
                
                {/* 1. Title & Info */}
                <div className="min-w-0 flex flex-col justify-center z-10">
                    <div className="font-bold truncate text-sm" title={task.title}>{task.title || 'Fetching info...'}</div>
                    <div className="text-xs text-muted-foreground truncate opacity-70 font-mono">{task.url}</div>
                    
                    <div className="flex flex-wrap gap-2 mt-1">
                        {task.range !== 'Full' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-100 font-mono">Clip: {task.range}</span>}
                        {task.status === 'error' && task.log && (
                            <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 truncate max-w-full md:max-w-[200px]" title={task.log}>
                                {task.log}
                            </span>
                        )}
                    </div>
                </div>

                {/* 2. Status Badge */}
                <div className="flex md:block items-center justify-between z-10">
                    <span className="md:hidden text-xs text-muted-foreground font-semibold uppercase">{t.headers.status}:</span>
                    <StatusBadge status={task.status} />
                </div>

                {/* 3. Progress Bar */}
                <div className="min-w-0 z-10 w-full">
                    <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 bg-secondary h-2.5 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                            <div 
                                className={cn("h-full transition-all duration-300 ease-out relative overflow-hidden", 
                                    task.status === 'error' ? "bg-red-500" : "bg-primary"
                                )}
                                style={{ width: `${task.progress}%` }}
                            >
                                {/* Shimmer on active download */}
                                {task.status === 'downloading' && (
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -skew-x-12 translate-x-[-100%]"></div>
                                )}
                            </div>
                        </div>
                        <span className="text-xs font-mono font-bold w-12 text-right">{task.progress.toFixed(0)}%</span>
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-muted-foreground/70 mt-1 font-mono uppercase tracking-wider">
                        <span>{task.speed || '0 B/s'}</span>
                        <span>ETA: {task.eta || '--:--'}</span>
                    </div>
                </div>

                {/* 4. Actions */}
                <div className="flex items-center justify-end gap-1 z-10 pt-2 md:pt-0 border-t md:border-0 border-dashed border-border/50 mt-2 md:mt-0">
                    {/* Developer Mode: Terminal Icon */}
                    {settings.developerMode && (
                        <button 
                            onClick={() => setShowCommandModal(true)}
                            className="p-2 hover:bg-purple-500/10 text-purple-500 rounded-lg transition-colors" 
                            title="View Command Details"
                        >
                            <Terminal className="w-5 h-5 md:w-4 md:h-4" />
                        </button>
                    )}

                    {task.status === 'downloading' && (
                        <>
                            <button onClick={() => pauseTask(task.id)} className="p-2 hover:bg-yellow-500/10 text-yellow-600 rounded-lg transition-colors" title="Pause (will restart from beginning when resumed)">
                                <Pause className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                            <button onClick={() => stopTask(task.id)} className="p-2 hover:bg-red-500/10 text-red-600 rounded-lg transition-colors" title={t.stop}>
                                <StopCircle className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                        </>
                    )}
                    {task.status === 'paused' && (
                        <>
                            <button onClick={() => resumeTask(task.id)} className="p-2 hover:bg-green-500/10 text-green-600 rounded-lg transition-colors" title="Resume (Restarts Process)">
                                <Play className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                            <button onClick={() => stopTask(task.id)} className="p-2 hover:bg-red-500/10 text-red-600 rounded-lg transition-colors" title={t.stop}>
                                <StopCircle className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                        </>
                    )}
                    {(task.status === 'error') && (
                        <>
                            <button onClick={() => retryTask(task.id)} className="p-2 hover:bg-orange-500/10 text-orange-600 rounded-lg transition-colors" title="Retry">
                                <RefreshCcw className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                            <button onClick={() => clearTask(task.id)} className="p-2 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors" title={t.clear}>
                                <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                        </>
                    )}
                    {(task.status === 'pending') && (
                        <button onClick={() => clearTask(task.id)} className="p-2 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors" title={t.clear}>
                            <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                        </button>
                    )}
                    {task.status === 'stopped' && (
                        <>
                            <button onClick={() => retryTask(task.id)} className="p-2 hover:bg-orange-500/10 text-orange-600 rounded-lg transition-colors" title={t.restart || "Restart"}>
                                <RefreshCcw className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                            <button onClick={() => clearTask(task.id)} className="p-2 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors" title={t.clear}>
                                <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                        </>
                    )}
                    {task.status === 'completed' && (
                        <>
                            <button onClick={() => {
                                const target = task.filePath || task.path;
                                if(target) openPath(target);
                            }} className="p-2 hover:bg-blue-500/10 text-blue-600 rounded-lg transition-colors" title={t.open_file}>
                                <Play className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                            <button onClick={() => task.path && openPath(task.path)} className="p-2 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors" title={t.open_folder}>
                                <FolderOpen className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                            <button onClick={() => clearTask(task.id)} className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors" title={t.clear}>
                                <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile Progress Background (Optional - Subtle) */}
                <div className="md:hidden absolute bottom-0 left-0 h-1 bg-primary/10 w-full z-0">
                    <div className="h-full bg-primary/20" style={{ width: `${task.progress}%` }}></div>
                </div>

            </div>

            {/* Command Modal */}
            <CommandModal 
                task={task} 
                isOpen={showCommandModal} 
                onClose={() => setShowCommandModal(false)} 
            />
        </>
    )
}
