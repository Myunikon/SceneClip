import { motion, AnimatePresence } from 'framer-motion'
import { FileText } from 'lucide-react'
import { UrlInput } from './UrlInput'
import { VideoPreview } from './VideoPreview'
import { VideoMeta, DialogOptions, DialogOptionSetters } from '../../types'

interface LeftPanelProps {
    url: string
    setUrl: (u: string) => void
    handlePaste: () => void
    t: any
    loadingMeta: boolean
    meta: VideoMeta | null
    errorMeta: boolean
    options: DialogOptions
    setters: DialogOptionSetters
    browse: () => void
}

export function LeftPanel({
    url, setUrl, handlePaste, t,
    loadingMeta, meta, errorMeta,
    options, setters,
    browse
}: LeftPanelProps) {
    
    const hasMeta = !!meta
    
    return (
        <div className={`relative z-20 p-6 space-y-6 lg:overflow-y-auto transition-all duration-500 ease-out ${hasMeta ? 'lg:w-[26rem] xl:w-[28rem] shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 bg-black/5 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.5)]' : 'w-full'}`}>
            


            <UrlInput 
                url={url} 
                onChange={setUrl} 
                onPaste={handlePaste} 
                t={t} 
                batchMode={options.batchMode}
                onBatchModeChange={setters.setBatchMode}
            />

            {!options.batchMode && <VideoPreview loading={loadingMeta} meta={meta} error={errorMeta} t={t} url={url} />}

            <AnimatePresence>
            {hasMeta && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="space-y-4 pt-1">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3 h-3 text-primary" />
                                {t.filename_label}
                            </label>
                            <input 
                                className="w-full p-3.5 rounded-xl bg-white dark:bg-black/20 border border-border dark:border-white/10 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/50 font-medium text-foreground shadow-sm"
                                placeholder={meta?.title ? meta.title.replace(/[\\/:*?"<>|]/g, '_') : t.filename_placeholder}
                                value={options.customFilename}
                                onChange={e => setters.setCustomFilename(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{t.folder_label}</label>
                            <div className="flex gap-2">
                                <input className="flex-1 p-3.5 rounded-xl bg-white dark:bg-black/20 border border-border dark:border-white/10 text-xs truncate font-mono text-muted-foreground shadow-sm" readOnly value={options.path || 'Downloads'} />
                                <button type="button" onClick={browse} className="px-4 border border-border dark:border-white/10 bg-white dark:bg-white/5 rounded-xl hover:bg-muted dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground shadow-sm">
                                    <span className="mb-1 block text-lg font-bold">...</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    )
}
