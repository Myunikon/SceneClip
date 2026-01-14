import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Video, Smartphone, HardDrive, Settings, Check, ChevronDown, ChevronUp, Cpu, Zap, Music, AlertTriangle, FolderOpen } from 'lucide-react'
import { DownloadTask, CompressionOptions, useAppStore } from '../store'
import { en } from '../lib/locales/en'
import { id } from '../lib/locales/id'
import { ms } from '../lib/locales/ms'
import { zh } from '../lib/locales/zh'
import { exists } from '@tauri-apps/plugin-fs'
import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { notify } from '../lib/notify'
import { Select } from './Select'

const LOCALES = { en, id, ms, zh }

interface CompressDialogProps {
    isOpen: boolean
    onClose: () => void
    task: DownloadTask | null
    onCompress: (taskId: string, options: CompressionOptions) => void
}

type PresetKey = 'wa' | 'social' | 'archive'

const PRESETS: Record<PresetKey, Partial<CompressionOptions>> = {
    wa: { crf: 28, resolution: '720', speedPreset: 'veryfast' },
    social: { crf: 23, resolution: '1080', speedPreset: 'medium' },
    archive: { crf: 18, resolution: 'original', speedPreset: 'slow' }
}

export function CompressDialog({ isOpen, onClose, task, onCompress }: CompressDialogProps) {
    const { settings, updateTask } = useAppStore()
    const t = (LOCALES as any)[(settings.language || 'en')]?.dialog?.compress || (en as any).dialog?.compress || {}

    // File validation state
    const [fileMissing, setFileMissing] = useState(false)
    const [resolvedPath, setResolvedPath] = useState<string | null>(null)
    const [isChecking, setIsChecking] = useState(true)

    // Check if file exists when dialog opens
    useEffect(() => {
        if (isOpen && task?.filePath) {
            setIsChecking(true)
            exists(task.filePath).then(ok => {
                setFileMissing(!ok)
                setResolvedPath(ok ? task.filePath ?? null : null)
                setIsChecking(false)
            }).catch(() => {
                setFileMissing(true)
                setResolvedPath(null)
                setIsChecking(false)
            })
        }
    }, [isOpen, task?.filePath])

    // Handle file browse
    // Check for double compression
    const isAlreadyCompressed = useMemo(() => {
        if (!task) return false
        return task.title.includes('_compress') || (task.filePath && task.filePath.includes('_compress'))
    }, [task])

    const handleBrowseFile = async () => {
        if (!task) return
        const selected = await openFileDialog({
            title: 'Select File',
            filters: [{ name: 'Media', extensions: ['mp4', 'mkv', 'webm', 'mp3', 'm4a', 'gif', 'jpg', 'png'] }]
        })
        if (selected) {
            const newPath = selected as string
            if (newPath) {
                setResolvedPath(newPath)
                setFileMissing(false)
                // Update task path in store
                updateTask(task.id, { filePath: newPath })
                notify.success(t.file_relocated || 'File path updated')
            }
        }
    }

    // Determine Type: Video, Audio, or Image (GIF)
    const mediaType = useMemo<'video' | 'audio' | 'image'>(() => {
        const pathToCheck = resolvedPath || task?.filePath
        if (!pathToCheck) return 'video'
        const lower = pathToCheck.toLowerCase()
        if (lower.endsWith('.mp3') || lower.endsWith('.m4a') || lower.endsWith('.wav') || lower.endsWith('.opus') || lower.endsWith('.ogg')) return 'audio'
        if (lower.endsWith('.gif') || lower.endsWith('.webp') || lower.endsWith('.png') || lower.endsWith('.jpg')) return 'image'
        return 'video'
    }, [task, resolvedPath])

    // State
    const [selectedPreset, setSelectedPreset] = useState<PresetKey>('social')
    const [isAdvanced, setIsAdvanced] = useState(false)
    
    // Custom settings
    const [crf, setCrf] = useState(23)
    const [resolution, setResolution] = useState('1080')
    const [encoder, setEncoder] = useState<'auto' | 'cpu' | 'nvenc' | 'amf' | 'qsv'>('auto')
    const [speedPreset, setSpeedPreset] = useState<string>('medium')
    const [audioBitrate, setAudioBitrate] = useState('128k') // New state

    // Helper to switch presets based on media type
    useEffect(() => {
        if (mediaType === 'audio') {
            // Audio Defaults
            if (selectedPreset === 'wa') setAudioBitrate('64k')      // Voice
            if (selectedPreset === 'social') setAudioBitrate('128k') // Standard
            if (selectedPreset === 'archive') setAudioBitrate('320k') // High
        } else {
            // Video Defaults
            const p = PRESETS[selectedPreset]
            if (p) {
                setCrf(p.crf!)
                setResolution(p.resolution!)
                setSpeedPreset(p.speedPreset!)
            }
        }
    }, [selectedPreset, mediaType])

    const handleCompress = () => {
        if (!task || fileMissing) return
        onCompress(task.id, {
            preset: isAdvanced ? 'custom' : selectedPreset,
            crf,
            resolution,
            encoder,
            speedPreset: speedPreset as any,
            audioBitrate 
        })
        onClose()
    }

    const renderPresets = () => {
        if (mediaType === 'audio') {
            return (
                <>
                    {/* Double Compression Warning */}
                    {isAlreadyCompressed && (
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                            <div className="mt-0.5 min-w-[16px]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                            </div>
                            <p className="text-xs text-yellow-500/90 leading-relaxed font-medium">
                                {t.double_compression_warning}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <PresetCard 
                            id="wa" title={t.preset_wa} desc={t.preset_wa_desc_audio} icon={Smartphone} color="text-green-500"
                            active={selectedPreset === 'wa'} onClick={() => setSelectedPreset('wa')} 
                        />
                        <PresetCard 
                            id="social" title={t.preset_social} desc={t.preset_social_desc_audio} icon={Music} color="text-blue-500"
                            active={selectedPreset === 'social'} onClick={() => setSelectedPreset('social')} 
                        />
                        <PresetCard 
                            id="archive" title={t.preset_archive} desc={t.preset_archive_desc_audio} icon={HardDrive} color="text-purple-500"
                            active={selectedPreset === 'archive'} onClick={() => setSelectedPreset('archive')} 
                        />
                    </div>
                </>
            )
        }
        // Video/Image Presets
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 <PresetCard 
                    id="wa" 
                    title={t.preset_wa} 
                    desc={mediaType === 'image' ? "Small (480p)" : t.preset_wa_desc} 
                    icon={Smartphone} 
                    color="text-green-500" 
                    active={selectedPreset === 'wa'} 
                    onClick={() => setSelectedPreset('wa')} 
                />
                 <PresetCard 
                    id="social" 
                    title={t.preset_social} 
                    desc={mediaType === 'image' ? "Balanced (720p)" : t.preset_social_desc} 
                    icon={Zap} 
                    color="text-blue-500" 
                    active={selectedPreset === 'social'} 
                    onClick={() => setSelectedPreset('social')} 
                />
                 <PresetCard 
                    id="archive" 
                    title={t.preset_archive} 
                    desc={t.preset_archive_desc} 
                    icon={HardDrive} 
                    color="text-purple-500" 
                    active={selectedPreset === 'archive'} 
                    onClick={() => setSelectedPreset('archive')} 
                />
            </div>
        )
    }

    if (!isOpen || !task) return null

    return createPortal(
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 10 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.95, opacity: 0, y: 10 }} 
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header: Dynamic Icon */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {mediaType === 'audio' ? <Music className="w-5 h-5 text-pink-500" /> : <Video className="w-5 h-5 text-primary" />}
                                {mediaType === 'audio' ? t.title_audio : mediaType === 'image' ? t.title_image : t.title_video}
                            </h2>
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">{task.title}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 overflow-y-auto space-y-6">
                        
                        {/* File Missing Warning */}
                        {fileMissing && (
                            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-destructive">{t.file_missing || 'File Not Found'}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{t.file_missing_desc || 'The original file has been moved or deleted.'}</p>
                                    <button 
                                        onClick={handleBrowseFile}
                                        className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                                    >
                                        <FolderOpen className="w-4 h-4" />
                                        {t.browse_file || 'Browse...'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {isChecking && (
                            <div className="text-center text-sm text-muted-foreground py-2">
                                Checking file...
                            </div>
                        )}
                        
                        {/* Render Dynamic Presets */}
                        {renderPresets()}

                         {/* File Info */}
                        <div className="bg-secondary/30 rounded-lg p-3 text-sm flex justify-between items-center text-muted-foreground">
                            <span>{t.original_size}: <span className="text-foreground font-mono">{task.fileSize || 'Unknown'}</span></span>
                            <span>{t.format}: <span className="uppercase text-foreground">{task.format || 'Auto'}</span></span>
                        </div>

                        {/* Advanced Settings */}
                        <div className="border border-border rounded-xl overflow-hidden">
                             {/* Toggle Button */}
                            <button 
                                onClick={() => setIsAdvanced(!isAdvanced)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-secondary/10 hover:bg-secondary/20 transition-colors text-sm font-medium"
                            >
                                <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> {t.advanced}</span>
                                {isAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            <AnimatePresence>
                                {isAdvanced && (
                                    <motion.div 
                                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 space-y-4 bg-muted/10 border-t border-border/50">
                                            
                                            {/* AUDIO ONLY SETTINGS */}
                                            {mediaType === 'audio' && (
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-muted-foreground">{t.lbl_bitrate}</label>
                                                    <Select 
                                                        value={audioBitrate} 
                                                        onChange={(v) => { setAudioBitrate(v); setSelectedPreset('custom' as any) }}
                                                        options={[
                                                            { value: '64k', label: '64 kbps (Voice)' },
                                                            { value: '96k', label: '96 kbps (Low)' },
                                                            { value: '128k', label: '128 kbps (Standard)' },
                                                            { value: '192k', label: '192 kbps (Good)' },
                                                            { value: '256k', label: '256 kbps (High)' },
                                                            { value: '320k', label: '320 kbps (Max)' }
                                                        ]}
                                                    />
                                                </div>
                                            )}

                                            {/* VIDEO/IMAGE ONLY SETTINGS */}
                                            {mediaType !== 'audio' && (
                                                <>
                                                 <div className="space-y-1.5">
                                                     <label className="text-xs font-medium text-muted-foreground">{t.lbl_resolution}</label>
                                                     <Select 
                                                        value={resolution} 
                                                        onChange={(v) => { setResolution(v); setSelectedPreset('custom' as any) }}
                                                        options={[
                                                            { value: 'original', label: 'Original (No Resize)' },
                                                            { value: '1080', label: '1080p (FHD)' },
                                                            { value: '720', label: '720p (HD)' },
                                                            { value: '480', label: '480p (SD)' }
                                                        ]}
                                                     />
                                                 </div>

                                                 {/* Video-Only Settings (Hidden for Image) */}
                                                 {mediaType === 'video' && (
                                                     <>
                                                         {/* CRF Slider */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between">
                                                                <label className="text-xs font-medium text-muted-foreground">{t.lbl_quality}</label>
                                                                <span className="text-xs font-mono bg-secondary px-1.5 rounded">{crf}</span>
                                                            </div>
                                                            <input 
                                                                type="range" min="0" max="51" step="1" 
                                                                value={crf} 
                                                                onChange={(e) => { setCrf(Number(e.target.value)); setSelectedPreset('custom' as any) }}
                                                                className="w-full transition-all accent-primary"
                                                            />
                                                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                                                <span>Original (0)</span>
                                                                <span>Standard (23)</span>
                                                                <span>Low (51)</span>
                                                            </div>
                                                        </div>

                                                        {/* Encoder */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                                <Cpu className="w-3 h-3" /> {t.lbl_encoder}
                                                            </label>
                                                            <Select 
                                                                value={encoder} 
                                                                onChange={(v) => { setEncoder(v as any); setSelectedPreset('custom' as any) }}
                                                                options={[
                                                                    { value: 'auto', label: 'Auto (Detect)' },
                                                                    { value: 'cpu', label: 'CPU (x264 software)' },
                                                                    { value: 'nvenc', label: 'NVIDIA (NVENC)' },
                                                                    { value: 'amf', label: 'AMD (AMF)' },
                                                                    { value: 'qsv', label: 'Intel (QSV)' }
                                                                ]}
                                                            />
                                                        </div>
                                                        
                                                        {/* Speed Preset */}
                                                        <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-muted-foreground">{t.lbl_speed}</label>
                                                                <Select 
                                                                    value={speedPreset} 
                                                                    onChange={(v) => { setSpeedPreset(v); setSelectedPreset('custom' as any) }}
                                                                    options={[
                                                                        { value: 'ultrafast', label: 'Ultrafast (Low Quality)' },
                                                                        { value: 'veryfast', label: 'Very Fast' },
                                                                        { value: 'medium', label: 'Medium (Default)' },
                                                                        { value: 'slow', label: 'Slow (Better Compression)' },
                                                                        { value: 'veryslow', label: 'Very Slow (Best Compression)' }
                                                                    ]}
                                                                />
                                                            </div>
                                                     </>
                                                 )}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 pt-2 flex justify-end gap-3 pb-6">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors">
                            {t.btn_cancel}
                        </button>
                        <button 
                            onClick={handleCompress}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" /> {t.btn_start}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

function PresetCard({ title, desc, icon: Icon, color, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                active 
                ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                : 'border-border hover:border-border/80 hover:bg-secondary/50'
            }`}
        >
            <div className={`p-2.5 rounded-full mb-3 ${active ? 'bg-primary/10' : 'bg-secondary'}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <h3 className="font-bold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">{desc}</p>
            {active && (
                <div className="absolute top-2 right-2 text-primary">
                    <Check className="w-3.5 h-3.5" />
                </div>
            )}
        </button>
    )
}
