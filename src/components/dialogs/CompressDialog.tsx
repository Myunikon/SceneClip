/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { DownloadTask, CompressionOptions, useAppStore } from '../../store'
import { exists } from '@tauri-apps/plugin-fs'
import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { notify } from '../../lib/notify'
import { Select } from '../ui'
import { SegmentedControl } from '../ui'
import { Switch } from '../ui'
import { useFileDrop } from '../../hooks/useFileDrop'
import { VIDEO_EXTS, AUDIO_EXTS, IMAGE_EXTS } from '../../lib/constants'
import { useTranslation } from 'react-i18next'

// Hooks
import { useExportForm } from '../../hooks/useExportForm'
import { useExportEstimator } from '../../hooks/useExportEstimator'

interface CompressDialogProps {
    isOpen: boolean
    onClose: () => void
    task: DownloadTask | null
    onCompress: (taskId: string, options: CompressionOptions) => void
}

export function CompressDialog({ isOpen, onClose, task, onCompress }: CompressDialogProps) {
    const { updateTask } = useAppStore()
    const { t: rawT } = useTranslation()
    const tc = (key: string, defaultVal: string = '') => rawT(`dialog.compress.${key}`, defaultVal)

    // --- File Validation & Drag/Drop State ---
    const [fileMissing, setFileMissing] = useState(false)
    const [resolvedPath, setResolvedPath] = useState<string | null>(null)

    // --- Media Type Logic ---
    // --- Media Type Logic ---
    const getMediaType = (): 'video' | 'audio' | 'image' => {
        const pathToCheck = resolvedPath || task?.filePath
        if (!pathToCheck) return 'video'
        const lower = pathToCheck.toLowerCase()
        const ext = lower.split('.').pop() || ''
        if (AUDIO_EXTS.includes(ext)) return 'audio'
        if (IMAGE_EXTS.includes(ext)) return 'image'
        return 'video'
    }
    const mediaType = getMediaType()

    // --- Hooks ---
    const form = useExportForm(mediaType)
    const estimatedSize = useExportEstimator({
        filePath: resolvedPath,
        originalSizeStr: task?.fileSize,
        mediaType,
        preset: form.preset,
        crf: form.crf,
        audioBitrate: form.audioBitrate
    })


    // --- Drag & Drop Handler ---
    const handleDrop = (files: string[]) => {
        const droppedFile = files[0]
        const ext = droppedFile.split('.').pop()?.toLowerCase()
        const allowed = [...VIDEO_EXTS, ...AUDIO_EXTS, ...IMAGE_EXTS]

        if (ext && allowed.includes(ext)) {
            setResolvedPath(droppedFile)
            setFileMissing(false)
            if (task) {
                updateTask(task.id, { filePath: droppedFile })
                notify.success(tc('file_relocated', 'File path updated'))
            }
        } else {
            notify.error("Invalid file type")
        }
    }

    const { isDragging } = useFileDrop({ isOpen, onDrop: handleDrop })

    // --- Effects ---
    // Check file existence when opening
    useEffect(() => {
        if (isOpen && task?.filePath) {
            exists(task.filePath).then(ok => {
                setFileMissing(!ok)
                setResolvedPath(ok ? task.filePath ?? null : null)
            }).catch(() => {
                setFileMissing(true)
                setResolvedPath(null)
            })
        }
    }, [isOpen, task?.filePath])

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
                updateTask(task.id, { filePath: newPath })
                notify.success(tc('file_relocated', 'File path updated'))
            }
        }
    }

    const handleInteract = () => {
        if (!task || fileMissing) return
        onCompress(task.id, {
            preset: form.preset === 'custom' ? 'custom' : form.preset,
            crf: form.crf,
            resolution: form.resolution,
            encoder: form.encoder,
            speedPreset: form.speedPreset as any,
            audioBitrate: form.audioBitrate
        })
        onClose()
    }

    if (!isOpen || !task) return null

    const presetOptions = [
        { value: 'wa', label: tc('preset_wa', 'WhatsApp') },
        { value: 'social', label: tc('preset_social', 'Social') },
        { value: 'archive', label: tc('preset_archive', 'Archive') },
    ]

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 supports-[backdrop-filter]:bg-black/40 supports-[backdrop-filter]:backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet / Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: isDragging ? 0.98 : 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                        className="relative w-full max-w-[440px] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-3xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/[0.08] flex flex-col max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Overlay */}
                        {isDragging && (
                            <div className="absolute inset-0 z-50 bg-primary/95 flex flex-col items-center justify-center text-white supports-[backdrop-filter]:bg-primary/90 supports-[backdrop-filter]:backdrop-blur-md">
                                <RefreshCw className="w-12 h-12 mb-2 animate-spin" />
                                <span className="text-lg font-semibold">{tc('drop_hint', 'Drop to replace file')}</span>
                            </div>
                        )}

                        {/* --- Header --- */}
                        <div className="flex flex-col items-center pt-6 pb-4 px-6 gap-2 text-center">
                            <h3 className="text-xl font-semibold text-foreground tracking-tight leading-none">
                                {tc('title', 'Export Media')}
                            </h3>
                            <div className="flex flex-col items-center gap-1 w-full">
                                <span className="text-sm text-muted-foreground truncate w-full max-w-[340px] text-center" title={task.filePath}>
                                    {task.title}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-xs text-muted-foreground bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                        {task.fileSize}
                                    </span>
                                    <button
                                        onClick={handleBrowseFile}
                                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        {tc('change_file', 'Change File...')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {fileMissing && (
                            <div className="mx-5 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                                <span className="text-xs font-semibold leading-relaxed">{tc('file_missing_error', 'Original file not found on disk.')}</span>
                            </div>
                        )}

                        {/* --- Body --- */}
                        <div className="px-5 pb-6 space-y-4 overflow-y-auto">
                            {/* Preset Selector */}
                            <div className="w-full">
                                <SegmentedControl
                                    options={presetOptions}
                                    value={form.preset}
                                    onChange={(v) => form.setPreset(v as any)}
                                />
                            </div>

                            {/* Grouped Settings List (Apple Style) */}
                            <div className="bg-white/60 dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.08] rounded-[10px] overflow-hidden shadow-sm divide-y divide-black/5 dark:divide-white/[0.08]">
                                {/* Info Row: Estimation */}
                                <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                                    <span className="text-base cursor-default">{tc('est_output', 'Estimated Size')}</span>
                                    <div className="flex items-center gap-2">
                                        {estimatedSize ? (
                                            <span className="font-medium text-foreground tabular-nums text-base">
                                                {estimatedSize}
                                            </span>
                                        ) : (
                                            <span className="text-base text-muted-foreground italic">Calculating...</span>
                                        )}
                                    </div>
                                </div>

                                {/* Advanced Setting Toggle */}
                                <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                                    <span className="text-base cursor-default">{tc('advanced', 'Advanced Settings')}</span>
                                    <Switch checked={form.isAdvanced} onCheckedChange={form.setIsAdvanced} />
                                </div>

                                <AnimatePresence>
                                    {form.isAdvanced && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-black/[0.02] dark:bg-white/[0.02] divide-y divide-black/5 dark:divide-white/[0.08]"
                                        >
                                            {/* Video Options */}
                                            {mediaType === 'video' && (
                                                <>
                                                    <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                                                        <span className="text-base cursor-default">{tc('lbl_resolution', 'Resolution')}</span>
                                                        <Select
                                                            value={form.resolution}
                                                            onChange={form.setResolution}
                                                            options={[
                                                                { value: 'original', label: 'Original' },
                                                                { value: '1080', label: '1080p' },
                                                                { value: '720', label: '720p' },
                                                                { value: '480', label: '480p' }
                                                            ]}
                                                            className="w-32 text-sm bg-transparent border-none text-right pr-1 focus:ring-0 shadow-none dark:bg-transparent"
                                                        />
                                                    </div>

                                                    <div className="px-4 py-3 space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-base cursor-default">{tc('lbl_quality', 'Quality (CRF)')}</span>
                                                            <span className="text-base font-medium text-muted-foreground tabular-nums">{form.crf}</span>
                                                        </div>
                                                        <input
                                                            type="range" min="15" max="45" step="1"
                                                            value={form.crf}
                                                            onChange={(e) => form.setCrf(Number(e.target.value))}
                                                            className="w-full h-1 bg-black/10 dark:bg-white/20 rounded-full appearance-none cursor-pointer accent-primary"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground w-full px-0.5">
                                                            <span>Better Quality</span>
                                                            <span>Smaller Size</span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Audio Options */}
                                            {mediaType === 'audio' && (
                                                <div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
                                                    <span className="text-base cursor-default">{tc('lbl_bitrate', 'Bitrate')}</span>
                                                    <Select
                                                        value={form.audioBitrate}
                                                        onChange={form.setAudioBitrate}
                                                        options={[
                                                            { value: '320k', label: '320 kbps (High)' },
                                                            { value: '192k', label: '192 kbps' },
                                                            { value: '128k', label: '128 kbps (Standard)' },
                                                            { value: '64k', label: '64 kbps (Voice)' },
                                                        ]}
                                                        className="w-32 text-sm bg-transparent border-none text-right pr-1 focus:ring-0 shadow-none dark:bg-transparent"
                                                    />
                                                </div>
                                            )}

                                            {/* Image Options */}
                                            {mediaType === 'image' && (
                                                <div className="text-sm text-muted-foreground text-center py-4 italic">
                                                    No advanced options for images yet.
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* --- Footer --- */}
                        <div className="p-4 pt-0 flex flex-wrap items-center justify-end gap-3 shrink-0">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 text-base font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap active:scale-[0.98]"
                            >
                                {tc('btn_cancel', 'Cancel')}
                            </button>
                            <button
                                onClick={handleInteract}
                                disabled={fileMissing}
                                className={`px-5 py-2 text-base font-semibold rounded-lg transition-all whitespace-nowrap
                                    ${fileMissing
                                        ? 'bg-primary/50 text-white/70 cursor-not-allowed opacity-70'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.98] shadow-sm'
                                    }`}
                            >
                                {tc('btn_export', 'Export')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
