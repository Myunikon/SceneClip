import { createPortal } from 'react-dom'
import { useState } from 'react'
import { Terminal, X, Copy, Check } from 'lucide-react'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { motion, AnimatePresence } from 'framer-motion'
import { DownloadTask } from '../../store/slices/types'

interface CommandModalProps {
    task: DownloadTask
    isOpen: boolean
    onClose: () => void
}

export function CommandModal({
    task,
    isOpen,
    onClose
}: CommandModalProps) {
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

    const highlightCommand = (cmd: string) => {
        if (!cmd) return ''
        let result = cmd
        result = result.replace(/(--[\w-]+)/g, '<span class="text-green-400">$1</span>')
            .replace(/(https?:\/\/[^\s]+)/g, '<span class="text-blue-400">$1</span>')
            // Match progress percentages
            .replace(/(\d+(\.\d+)?%)/g, '<span class="text-emerald-400 font-bold">$1</span>')
            // Match speed like 1.5MiB/s or 500KiB/s
            .replace(/(\d+\.?\d*\s?[KMG]i?B\/s)/gi, '<span class="text-cyan-400">$1</span>')
            .replace(/(ETA\s+[\d:]+|in\s+[\d:]+|\d+:\d{2}:\d{2}|\d{2}:\d{2})/g, '<span class="text-amber-400">$1</span>')
        result = result.replace(/("[^"]*")/g, '<span class="text-yellow-400">$1</span>')
        return result
    }

    if (!isOpen) return null

    const modalContent = (
        <>
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold">Command Details</h3>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-auto">
                <div className="bg-secondary/30 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Task</div>
                    <div className="font-medium truncate">{task.title || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{task.url}</div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase text-green-400 flex items-center gap-1">
                            <Terminal className="w-3 h-3" /> yt-dlp Command
                        </label>
                        <button
                            onClick={() => task.ytdlpCommand && copyCommand(task.ytdlpCommand, 'ytdlp')}
                            disabled={!task.ytdlpCommand}
                            className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-secondary rounded disabled:opacity-50 transition-colors"
                        >
                            {copiedYtdlp ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            {copiedYtdlp ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <div className="bg-black/80 p-3 rounded-lg border border-white/10 font-mono text-xs overflow-x-auto">
                        {task.ytdlpCommand ? (
                            <code className="text-gray-300 whitespace-pre-wrap break-all" dangerouslySetInnerHTML={{ __html: highlightCommand(task.ytdlpCommand) }} />
                        ) : (
                            <span className="text-gray-500 italic">No command recorded</span>
                        )}
                    </div>
                </div>
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
                            <code className="text-gray-300 whitespace-pre-wrap break-all" dangerouslySetInnerHTML={{ __html: highlightCommand(task.ffmpegCommand) }} />
                        </div>
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-border bg-secondary/20 text-center">
                <p className="text-xs text-muted-foreground">💡 Copy these commands to run manually in your terminal</p>
            </div>
        </>
    )

    // Using Portal to render at document.body level to ensure backdrop covers everything
    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                    className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl relative z-10 overflow-hidden"
                >
                    {modalContent}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    )
}
