import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Download, Plus, Settings, HardDrive, AlertCircle } from 'lucide-react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { downloadDir } from '@tauri-apps/api/path'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store'
import { translations } from '../lib/locales'
import { SelectDownloadType } from './SelectDownloadType'
import { Switch } from './Switch'
import { parseYtDlpJson } from '../lib/ytdlp'

// Sub-components
import { VideoPreview } from './add-dialog/VideoPreview'
import { UrlInput } from './add-dialog/UrlInput'
import { ClipSection, parseTime } from './add-dialog/ClipSection'

interface AddDialogProps {
    addTask: (url: string, opts: any) => any
    initialUrl?: string
    previewLang?: string | null
}

export type AddDialogHandle = {
    showModal: () => void
    close: () => void
}

export const AddDialog = forwardRef<AddDialogHandle, AddDialogProps>(({ addTask, initialUrl, previewLang }, ref) => {
    const { settings } = useAppStore()
    const t = translations[(previewLang ?? settings.language) as keyof typeof translations].dialog

    const [url, setUrl] = useState('')
    const [format, setFormat] = useState('Best')
    const [path, setPath] = useState('')
    const [rangeStart, setRangeStart] = useState('')
    const [rangeEnd, setRangeEnd] = useState('')
    const [sponsorBlock, setSponsorBlock] = useState(false)


    const [container, setContainer] = useState<string>(settings.container || 'mp4')
    
    // Auto-paste initial URL
    useEffect(() => {
        if(initialUrl) setUrl(initialUrl)
    }, [initialUrl])

    // Metadata State
    const [meta, setMeta] = useState<{ title: string, thumbnail: string, duration?: number, filesize_approx?: number, formats?: any[] } | null>(null)
    const [loadingMeta, setLoadingMeta] = useState(false)
    const [errorMeta, setErrorMeta] = useState(false)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    // Debounced Metadata Fetch
    useEffect(() => {
        if (!url || !url.startsWith('http')) {
            setMeta(null)
            setErrorMeta(false)
            return
        }

        if (debounceRef.current) clearTimeout(debounceRef.current)

        setLoadingMeta(true)
        setErrorMeta(false)

        debounceRef.current = setTimeout(async () => {
            try {
                // Use shared sidecar command factory
                const { getYtDlpCommand } = await import('../lib/ytdlp')
                const cmd = await getYtDlpCommand(['--dump-json', '--no-warnings', '--', url])
                const output = await cmd.execute()
                
                if (output.code === 0) {
                    const data = parseYtDlpJson(output.stdout)
                    setMeta({
                        title: data.title,
                        thumbnail: data.thumbnail,
                        duration: data.duration,
                        filesize_approx: data.filesize_approx || data.filesize,
                        formats: data.formats
                    })
                } else {
                    throw new Error(output.stderr)
                }
            } catch (e) {
                console.error("Metadata fetch failed", e)
                setErrorMeta(true)
                setMeta(null)
            } finally {
                setLoadingMeta(false)
            }
        }, 1000)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [url])

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ''
        const units = ['B', 'KB', 'MB', 'GB']
        let size = bytes
        let unitIndex = 0
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024
            unitIndex++
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`
    }

    const [isOpen, setIsOpen] = useState(false)

    useImperativeHandle(ref, () => ({
        showModal: () => setIsOpen(true),
        close: () => setIsOpen(false)
    }))

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        if (isOpen) window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen])

    const [isClipping, setIsClipping] = useState(false)

    // Compute Available Resolutions (Dynamic Formats)
    const availableResolutions = meta?.formats ? (() => {
        const heights = meta.formats.map((f: any) => f.height).filter((h: any) => typeof h === 'number' && h > 0)
        return [...new Set(heights)].sort((a, b) => b - a) as number[]
    })() : undefined

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        let savePath = path
        if (!savePath) {
            savePath = await downloadDir()
        }

        const start = isClipping ? rangeStart : ''
        const end = isClipping ? rangeEnd : ''

        addTask(url, { path: savePath, format, rangeStart: start, rangeEnd: end, sponsorBlock, container })
        
        setUrl('')
        setRangeStart('')
        setRangeEnd('')
        setIsClipping(false)
        setMeta(null)
        setErrorMeta(false)
        setIsOpen(false)
    }

    const browse = async () => {
        const p = await openDialog({ directory: true })
        if (p) setPath(p)
    }

    const handlePaste = async () => {
        try {
            const text = await readText();
            if (text) {
                setUrl(text);
                return;
            }
        } catch (e) {
            console.warn('Tauri clipboard failed, trying Web API', e);
        }
        
        try {
            const text = await navigator.clipboard.readText();
            if (text) setUrl(text);
        } catch (e) {
            console.error('All clipboard paste attempts failed', e);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        className="glass-strong relative z-10 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header / Preview */}
                        <VideoPreview loading={loadingMeta} meta={meta} error={errorMeta} t={t} />

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden bg-background/95">
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span className="bg-primary/20 p-1.5 rounded-lg text-primary"><Plus className="w-5 h-5" /></span>
                                    {t.title}
                                </h3>

                                <UrlInput url={url} onChange={setUrl} onPaste={handlePaste} t={t} />

                                <SelectDownloadType
                                    format={format} setFormat={setFormat}
                                    container={container} setContainer={setContainer}
                                    availableResolutions={availableResolutions}
                                />

                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.folder_label}</label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 p-3 rounded-xl border bg-secondary/20 text-xs truncate font-mono text-muted-foreground" readOnly value={path || 'Downloads'} />
                                        <button type="button" onClick={browse} className="px-4 border rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                                            <span className="mb-2 block text-lg font-bold">...</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold mb-3 flex items-center gap-1 text-muted-foreground uppercase"><Settings className="w-3 h-3" /> {t.enhancements_label}</h4>
                                        <label 
                                            className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-transparent hover:border-primary/20 transition-all cursor-pointer group relative"
                                        >
                                            <span className="flex items-center gap-2 font-medium text-sm text-foreground">
                                                {t.sponsor_label}
                                                <AlertCircle className="w-3 h-3 text-muted-foreground/50" />
                                            </span>
                                            <Switch
                                                checked={sponsorBlock}
                                                onCheckedChange={setSponsorBlock}
                                            />
                                        </label>
                                    </div>

                                    <ClipSection 
                                        isClipping={isClipping} setIsClipping={setIsClipping}
                                        duration={meta?.duration}
                                        rangeStart={rangeStart} setRangeStart={setRangeStart}
                                        rangeEnd={rangeEnd} setRangeEnd={setRangeEnd}
                                        t={t}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-6 border-t bg-background shrink-0 gap-4 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                                <div className="flex-1 min-w-0">
                                    {meta?.filesize_approx && (
                                        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Est. Size</span>
                                            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-foreground">
                                                <HardDrive className="w-3 h-3 text-primary" />
                                                {(() => {
                                                    const total = meta.duration || 1
                                                    let ratio = 1
                                                    if (isClipping) {
                                                        const s = parseTime(rangeStart)
                                                        const e = rangeEnd ? parseTime(rangeEnd) : total
                                                        const duration = Math.max(0, Math.min(e, total) - Math.max(0, s))
                                                        ratio = duration / total
                                                    }
                                                    const estimatedSize = meta.filesize_approx * ratio
                                                    return formatFileSize(estimatedSize)
                                                })()}
                                                {isClipping && <span className="text-muted-foreground scale-75 origin-left opacity-50">(clipped)</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-2.5 hover:bg-secondary rounded-xl font-medium transition-colors text-sm">{t.cancel}</button>
                                    <button 
                                        type="submit" 
                                        disabled={!url || (isClipping && !!rangeStart && !!rangeEnd && parseTime(rangeStart) >= parseTime(rangeEnd))} 
                                        className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 shadow-lg shadow-primary/25 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 transform active:scale-95"
                                    >
                                        <Download className="w-4 h-4" />
                                        {t.download}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
})
AddDialog.displayName = 'AddDialog'
