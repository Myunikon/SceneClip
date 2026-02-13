import { useState, useEffect } from 'react'
import { AlertCircle, ImageOff, X, ExternalLink, ZoomIn } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { openUrl } from '@tauri-apps/plugin-opener'

interface VideoPreviewProps {
    loading: boolean
    meta: {
        title: string
        thumbnail: string
    } | null
    error: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: (key: string, options?: any) => string

    url?: string
}

import { getProxiedSrc } from '../../../lib/image-proxy'

export function VideoPreview({ loading, meta, error, t, url }: VideoPreviewProps) {
    const [imgError, setImgError] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [focusedElementBeforePreview, setFocusedElementBeforePreview] = useState<HTMLElement | null>(null)

    // Focus Management
    useEffect(() => {
        if (isPreviewOpen) {
            // Save current focus
            setFocusedElementBeforePreview(document.activeElement as HTMLElement)
        } else if (focusedElementBeforePreview) {
            // Restore focus (use optional chaining in case element was removed from DOM)
            focusedElementBeforePreview?.focus?.()
            setFocusedElementBeforePreview(null)
        }
    }, [isPreviewOpen, focusedElementBeforePreview])

    // Focus Trap
    useEffect(() => {
        if (!isPreviewOpen) return

        const handleFocusTrap = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return

            const modal = document.getElementById('video-preview-modal')
            if (!modal) return

            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            const firstElement = focusableElements[0] as HTMLElement
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault()
                    lastElement.focus()
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault()
                    firstElement.focus()
                }
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsPreviewOpen(false)
        }

        document.addEventListener('keydown', handleFocusTrap)
        document.addEventListener('keydown', handleEscape)

        // Initial focus
        const modal = document.getElementById('video-preview-modal')
        if (modal) {
            // Small timeout to allow render
            setTimeout(() => {
                (modal.querySelector('button') as HTMLElement)?.focus()
            }, 50)
        }

        return () => {
            document.removeEventListener('keydown', handleFocusTrap)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isPreviewOpen])

    const imageSrc = getProxiedSrc(meta?.thumbnail)

    const handleOpenLink = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (url) {
            try {
                await openUrl(url)
            } catch (err) {
                console.error("Failed to open URL", err)
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (meta && !imgError) setIsPreviewOpen(true)
        }
    }

    return (
        <>
            {/* --- 1. PREVIEW KECIL (THUMBNAIL) --- */}
            <AnimatePresence mode="wait">
                {(loading || meta || error) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        className="relative w-full shrink-0 flex flex-col overflow-hidden"
                    >
                        <button
                            type="button"
                            className={`w-full relative flex items-center justify-center text-center rounded-xl overflow-hidden group focus:outline-none focus:ring-4 focus:ring-primary/20 focus:scale-[0.99] transition-all duration-500 aspect-video
                            ${meta
                                    ? 'bg-black shadow-lg border border-white/10'
                                    : 'bg-secondary/30 dark:bg-black/20 border-2 border-dashed border-border/60' // Loading/Error state border
                                }`}
                            onClick={() => meta && !imgError && setIsPreviewOpen(true)}
                            onKeyDown={handleKeyDown}
                            disabled={loading || error || !meta}
                        >
                            {loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/20 backdrop-blur-sm animate-pulse">
                                    <div className="w-full h-full absolute inset-0 bg-secondary/40"></div>
                                    <div className="relative z-20 flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-white/10 shadow-lg mb-2"></div>
                                        <div className="h-4 w-48 bg-white/10 rounded-full"></div>
                                        <div className="h-3 w-32 bg-white/5 rounded-full"></div>
                                    </div>
                                </div>
                            ) : meta ? (
                                <>
                                    {!imgError ? (
                                        <div className="relative w-full h-full cursor-zoom-in group">
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 z-10" />
                                            <img
                                                src={imageSrc}
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-102"
                                                alt="Thumbnail"
                                                draggable={false}
                                                onError={() => setImgError(true)}
                                            />

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity duration-300 pointer-events-none z-20"></div>

                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 z-30">
                                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white shadow-2xl border border-white/20">
                                                    <ZoomIn className="w-6 h-6 drop-shadow-md" />
                                                </div>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 p-8 text-left space-y-2 z-30 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                                <h4 className="font-bold text-white text-xl line-clamp-2 leading-tight drop-shadow-lg pointer-events-none tracking-tight">
                                                    {meta.title}
                                                </h4>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary/80 to-muted/80 dark:from-secondary/20 dark:to-muted/10 p-6 text-center animate-in fade-in duration-300">
                                            <div className="p-5 bg-background/50 dark:bg-white/5 rounded-full mb-4 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                                                <ImageOff className="w-10 h-10 text-muted-foreground/50" />
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground/70 max-w-[200px] line-clamp-2 leading-relaxed">
                                                {t('dialog.preview.no_thumbnail') || t('dialog.preview.no_image_available') || 'No thumbnail available'}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : error ? (
                                <div className="text-red-500 flex flex-col items-center animate-in zoom-in opacity-80 px-4 z-10">
                                    <div className="p-4 bg-red-500/10 rounded-full mb-3">
                                        <AlertCircle className="w-8 h-8 stroke-[1.5]" />
                                    </div>
                                    <p className="text-sm font-semibold">{t('dialog.preview.failed')}</p>
                                </div>
                            ) : null}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- 2. LIGHTBOX (PREVIEW BESAR) --- */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isPreviewOpen && meta && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8"
                            onClick={() => setIsPreviewOpen(false)}
                            id="video-preview-modal"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative max-w-5xl w-full max-h-screen flex flex-col gap-6"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black/50 border border-white/10 group">
                                    <img
                                        src={imageSrc}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                                        alt={meta.title}
                                        draggable={false}
                                    />

                                    <button
                                        onClick={() => setIsPreviewOpen(false)}
                                        className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 shadow-lg"
                                        title="Close Preview (Esc)"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="text-center text-white space-y-3 px-4">
                                    <h3 className="text-2xl font-bold leading-tight drop-shadow-lg">{meta.title}</h3>

                                    {/* PERBAIKAN 2: LINK TEKS SIMPEL (Tanpa Background)
                                        - text-white/60: Warna default (abu keputihan)
                                        - hover:text-blue-400: Berubah jadi biru saat hover
                                        - transition-colors: Animasi perubahan warna halus
                                    */}
                                    {url && (
                                        <button
                                            onClick={handleOpenLink}
                                            className="inline-flex items-center justify-center gap-2 text-sm text-white/60 hover:text-blue-400 transition-colors py-2 hover:underline underline-offset-4 decoration-blue-400/30"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            <span className="truncate max-w-lg">{url}</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}