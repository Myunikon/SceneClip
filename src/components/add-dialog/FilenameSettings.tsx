import { FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DialogOptions, DialogOptionSetters, VideoMeta } from '../../types'

interface FilenameSettingsProps {
    options: DialogOptions
    setters: DialogOptionSetters
    meta: VideoMeta | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any
    browse: () => void
}

export function FilenameSettings({
    options, setters, meta, t, browse
}: FilenameSettingsProps) {
    if (!meta) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden p-0.5"
            >
                <div className="space-y-4 pt-0.5">
                    {!options.batchMode && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3 h-3 text-primary" />
                                {t('dialog.filename_label')}
                            </label>
                            <input
                                className="w-full p-3.5 rounded-xl bg-white dark:bg-black/20 border border-border dark:border-white/10 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:ring-inset outline-none transition-all placeholder:text-muted-foreground/50 font-medium text-foreground shadow-sm"
                                placeholder={meta?.title ? meta.title.replace(/[\\/:*?"<>|]/g, '_') : t('dialog.filename_placeholder')}
                                value={options.customFilename}
                                onChange={e => setters.setCustomFilename(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{t('dialog.folder_label')}</label>
                        <div className="flex gap-2">
                            <input className="flex-1 p-3.5 rounded-xl bg-white dark:bg-black/20 border border-border dark:border-white/10 text-xs truncate font-mono text-muted-foreground shadow-sm" readOnly value={options.path || 'Downloads'} />
                            <button type="button" onClick={browse} className="px-4 border border-border dark:border-white/10 bg-white dark:bg-white/5 rounded-xl hover:bg-muted dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground shadow-sm">
                                <span className="mb-1 block text-lg font-bold">...</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
