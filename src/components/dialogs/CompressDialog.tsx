/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, RefreshCw, FileVideo, Music, Image as ImageIcon } from 'lucide-react'
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

    // Icon helper
    const FileIcon = mediaType === 'audio' ? Music : mediaType === 'image' ? ImageIcon : FileVideo


    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet / Dialog */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: isDragging ? 0.92 : 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-[500px] bg-[#F5F5F7] dark:bg-[#1E1E1E] rounded-xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Overlay */}
                        {isDragging && (
                            <div className="absolute inset-0 z-50 bg-primary/90 flex flex-col items-center justify-center text-white backdrop-blur-md">
                                <RefreshCw className="w-12 h-12 mb-2 animate-spin" />
                                <span className="text-lg font-semibold">{tc('drop_hint', 'Drop to replace file')}</span>
                            </div>
                        )}

                        {/* --- Header --- */}
                        <div className="flex items-start p-5 pb-4 gap-3">
                            <div className="h-10 w-10 shrink-0 bg-white/50 dark:bg-white/10 rounded-lg flex items-center justify-center shadow-sm border border-black/5">
                                <FileIcon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[40px]">
                                <h3 className="text-[17px] font-semibold text-foreground leading-snug">
                                    {tc('title', 'Export Media')}
                                </h3>
                                <div className="flex flex-wrap items-center text-[13px] text-muted-foreground gap-1.5 leading-normal" title={task.filePath}>
                                    <span className="truncate max-w-full">{task.title}</span>
                                    <span className="opacity-50 hidden sm:inline">•</span>
                                    <span className="font-mono text-[11px] bg-black/5 dark:bg-white/10 px-1 rounded whitespace-nowrap">{task.fileSize}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleBrowseFile}
                                className="shrink-0 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors mt-1"
                            >
                                {tc('change_file', 'Change')}
                            </button>
                        </div>

                        {fileMissing && (
                            <div className="mx-5 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
                                <span className="text-xs font-semibold leading-relaxed">{tc('file_missing_error', 'Original file not found on disk.')}</span>
                            </div>
                        )}

                        {/* --- Body --- */}
                        <div className="px-5 pb-6 space-y-5 overflow-y-auto">
                            {/* Preset Selector */}
                            <div className="space-y-2">
                                <label className="text-[13px] font-medium text-muted-foreground ml-1">
                                    {tc('preset_label', 'Preset')}
                                </label>
                                <div className="w-full overflow-x-auto pb-1">
                                    <SegmentedControl
                                        options={presetOptions}
                                        value={form.preset}
                                        onChange={(v) => form.setPreset(v as any)}
                                    />
                                </div>
                            </div>

                            {/* Info Card: Estimation */}
                            <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-3 flex flex-wrap justify-between items-center gap-2 shadow-sm">
                                <span className="text-sm font-medium text-muted-foreground pl-1">
                                    {tc('est_output', 'Estimated Size')}
                                </span>
                                <div className="flex items-center gap-2">
                                    {estimatedSize ? (
                                        <span className="font-bold text-foreground tabular-nums text-sm bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                                            ~{estimatedSize}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Calculating...</span>
                                    )}
                                </div>
                            </div>

                            {/* Advanced Section */}
                            <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between p-3 pl-4">
                                    <span className="text-sm font-medium">{tc('advanced', 'Advanced Settings')}</span>
                                    <Switch checked={form.isAdvanced} onCheckedChange={form.setIsAdvanced} />
                                </div>

                                <AnimatePresence>
                                    {form.isAdvanced && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-black/5 dark:border-white/5 bg-muted/30"
                                        >
                                            <div className="p-4 space-y-4">
                                                {/* Video Options */}
                                                {mediaType === 'video' && (
                                                    <>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between">
                                                                <span className="text-xs font-medium text-muted-foreground">{tc('lbl_resolution', 'Resolution')}</span>
                                                            </div>
                                                            <Select
                                                                value={form.resolution}
                                                                onChange={form.setResolution}
                                                                options={[
                                                                    { value: 'original', label: 'Original' },
                                                                    { value: '1080', label: '1080p' },
                                                                    { value: '720', label: '720p' },
                                                                    { value: '480', label: '480p' }
                                                                ]}
                                                                className="w-full text-sm min-h-[36px] bg-white dark:bg-black/20"
                                                            />
                                                        </div>

                                                        <div className="space-y-3 pt-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-medium text-muted-foreground">{tc('lbl_quality', 'Quality (CRF)')}</span>
                                                                <span className="text-xs font-mono font-bold">{form.crf}</span>
                                                            </div>
                                                            <input
                                                                type="range" min="15" max="45" step="1"
                                                                value={form.crf}
                                                                onChange={(e) => form.setCrf(Number(e.target.value))}
                                                                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                            />
                                                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                                                <span>Better Quality</span>
                                                                <span>Smaller Size</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Audio Options */}
                                                {mediaType === 'audio' && (
                                                    <div className="space-y-1.5">
                                                        <span className="text-xs font-medium text-muted-foreground">{tc('lbl_bitrate', 'Bitrate')}</span>
                                                        <Select
                                                            value={form.audioBitrate}
                                                            onChange={form.setAudioBitrate}
                                                            options={[
                                                                { value: '320k', label: '320 kbps (High)' },
                                                                { value: '192k', label: '192 kbps' },
                                                                { value: '128k', label: '128 kbps (Standard)' },
                                                                { value: '64k', label: '64 kbps (Voice)' },
                                                            ]}
                                                            className="w-full text-sm min-h-[36px] bg-white dark:bg-black/20"
                                                        />
                                                    </div>
                                                )}

                                                {/* Image Options */}
                                                {mediaType === 'image' && (
                                                    <div className="text-sm text-muted-foreground text-center py-2 italic">
                                                        No advanced options for images yet.
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* --- Footer --- */}
                        <div className="p-4 pt-3 flex flex-wrap items-center justify-end gap-3 border-t border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 shrink-0">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap"
                            >
                                {tc('btn_cancel', 'Cancel')}
                            </button>
                            <button
                                onClick={handleInteract}
                                disabled={fileMissing}
                                className={`px-6 py-2 text-[13px] font-semibold text-white rounded-lg shadow-sm transition-all whitespace-nowrap
                                    ${fileMissing
                                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-70'
                                        : 'bg-primary hover:bg-primary/90 active:scale-95 shadow-primary/25'
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
