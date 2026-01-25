import { forwardRef, useImperativeHandle, useState, useEffect } from 'react'
import { Download, HardDrive } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LeftPanel } from './add-dialog/LeftPanel'
import { RightPanel } from './add-dialog/RightPanel'
import { useAddDialog } from './add-dialog/useAddDialog'
import { AddDialogProvider } from './add-dialog/AddDialogContext'
import { parseTime, cn } from '../lib/utils'
import { DownloadOptions } from '../types'

interface AddDialogProps {
    addTask: (url: string, opts: DownloadOptions) => Promise<void>
    initialUrl?: string
    initialCookies?: string
    initialUserAgent?: string
    initialStart?: number
    initialEnd?: number
    isOffline?: boolean
}

export type AddDialogHandle = {
    showModal: () => void
    close: () => void
    quickDownload: (url: string) => Promise<boolean>
}

export const AddDialog = forwardRef<AddDialogHandle, AddDialogProps>((props, ref) => {
    const {
        isOpen, setIsOpen,
        url, setUrl,
        options, setters,
        meta, loadingMeta, errorMeta,
        availableResolutions, availableAudioBitrates, availableVideoCodecs, availableAudioCodecs, availableLanguages,
        handleSubmit, browse, handlePaste, quickDownload,
        t,
        formatFileSize,
        estimatedSize,
        resetForm,
        isDiskFull,
        diskFreeSpace
    } = useAddDialog({
        ...props
    })



    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        showModal: () => setIsOpen(true),
        close: () => {
            resetForm()
            setIsOpen(false)
        },
        quickDownload
    }))

    // Styles
    const backdropClass = 'absolute inset-0 bg-black/60 backdrop-blur-sm'

    // Dialog class logic
    const hasMeta = !!meta
    const dialogClass = `glass-strong relative z-10 w-full ${hasMeta ? 'md:max-w-5xl' : 'md:max-w-lg'} md:rounded-2xl rounded-t-2xl rounded-b-none md:rounded-b-2xl overflow-hidden shadow-2xl flex flex-col md:max-h-[90vh] max-h-[85vh] border border-white/10 mt-auto md:mt-0`

    // Animation Variants
    const desktopVariants = {
        initial: { opacity: 0, scale: 0.95, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 10 }
    }

    const mobileVariants = {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" }
    }

    // Determine if mobile (dynamic listener)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])


    const formClass = 'flex flex-col flex-1 overflow-hidden bg-background dark:bg-background/40 dark:backdrop-blur-md'

    const formattedSize = formatFileSize(estimatedSize || 0)

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, pointerEvents: 'none' }}
                    animate={{ opacity: 1, pointerEvents: 'auto' }}
                    exit={{ opacity: 0, pointerEvents: 'none' }}
                    className="fixed inset-0 z-50 flex md:items-center items-end justify-center md:p-4 p-0"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className={backdropClass}
                    />

                    <motion.div
                        variants={isMobile ? mobileVariants : desktopVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        className={dialogClass}
                    >
                        <form onSubmit={handleSubmit} className={formClass}>

                            {/* --- HEADER (Apple Sheet Style) --- */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur-md shrink-0 z-20">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm()
                                        setIsOpen(false)
                                    }}
                                    className="text-primary hover:text-primary/80 text-[15px] font-medium transition-colors"
                                >
                                    {t('dialog.cancel')}
                                </button>

                                <div className="absolute left-1/2 -translate-x-1/2 font-semibold text-[15px] text-foreground">
                                    {meta ? t('dialog.customize_download') : t('dialog.new_download')}
                                </div>

                                <div className="w-[40px]" /> {/* Spacer for centering */}
                            </div>

                            {/* Main Split Layout */}
                            <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden overflow-y-auto scrollbar-thin">
                                <AddDialogProvider value={{
                                    url, setUrl,
                                    options, setters,
                                    meta, loadingMeta, errorMeta, hasMeta,
                                    availableResolutions, availableAudioBitrates, availableVideoCodecs, availableAudioCodecs, availableLanguages,
                                    browse, handlePaste,
                                    t, formatFileSize, estimatedSize,
                                    isDiskFull, diskFreeSpace
                                }}>
                                    <LeftPanel />
                                    <RightPanel />
                                </AddDialogProvider>
                            </div>

                            <div className="flex justify-between items-center p-4 border-t border-border/40 bg-background/80 backdrop-blur-md shrink-0 gap-4 z-20">
                                <div className="flex-1 min-w-0">
                                    {(estimatedSize || (meta?.formats)) && hasMeta && (
                                        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{t('dialog_status.est_size')}</span>
                                            <div className="flex items-center gap-2 text-sm font-mono font-medium text-foreground overflow-hidden h-5">
                                                <HardDrive className={cn("w-3.5 h-3.5", isDiskFull ? "text-red-500" : "text-primary")} />
                                                <span className={cn("block min-w-[3ch]", isDiskFull ? "text-red-500" : "")}>
                                                    {formattedSize}
                                                </span>
                                                {options.isClipping && <span className="text-orange-500 text-[10px] font-bold px-1.5 py-0.5 bg-orange-500/10 rounded-full border border-orange-500/20">{t('dialog_status.trimmed')}</span>}
                                                {isDiskFull && (
                                                    <span className="text-red-500 text-xs flex items-center gap-1 ml-2">
                                                        <span className="font-bold">⚠️ {t('dialog_status.disk_full')}</span>
                                                        <span className="opacity-70">({formatFileSize(diskFreeSpace || 0)} free)</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSubmit()}
                                        disabled={
                                            !hasMeta ||
                                            props.isOffline ||
                                            isDiskFull ||
                                            (options.isClipping && !!options.rangeStart && !!options.rangeEnd && (parseTime(options.rangeEnd) - parseTime(options.rangeStart) < 1))
                                        }
                                        className={cn(
                                            "px-8 py-2.5 rounded-full font-semibold text-sm transition-all focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                                            isDiskFull
                                                ? "bg-red-500 text-white"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                                        )}
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>{options.batchMode ? t('dialog.download_all') : t('dialog.download')}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
AddDialog.displayName = 'AddDialog'
