import { FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DialogOptions, DialogOptionSetters, VideoMeta } from '@/types'
import { TFunction } from 'i18next'
import { Input, Button } from '@/components/ui'

interface FilenameSettingsProps {
    options: DialogOptions
    setters: DialogOptionSetters
    meta: VideoMeta | null
    t: TFunction
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
                            <label className="cq-text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3 h-3 text-primary" />
                                {t('dialog.filename_label')}
                            </label>
                            <Input
                                placeholder={t('dialog.filename_placeholder') || "Custom filename (No extension)"}
                                value={options.customFilename}
                                onChange={e => setters.setCustomFilename(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="cq-text-xs font-bold uppercase text-muted-foreground tracking-wider">{t('dialog.folder_label')}</label>
                        <div className="flex gap-2">
                            <Input readOnly value={options.path || 'Downloads'} className="font-mono text-muted-foreground" />
                            <Button type="button" variant="outline" onClick={browse} className="px-4 h-10 rounded-lg shrink-0">
                                <span className="mb-1 block text-lg font-bold">...</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
