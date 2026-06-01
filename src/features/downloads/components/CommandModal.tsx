import { useState } from 'react'
import { Terminal, Copy, Check } from 'lucide-react'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { DownloadTask } from '@/store/slices/types'
import { Modal } from '@/components/ui'

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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Command Details"
            maxWidth="2xl"
            headerBg="bg-secondary/30"
            headerIcon={<Terminal className="w-5 h-5 text-purple-400" />}
        >
            <div className="p-4 space-y-4">
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
        </Modal>
    )
}
