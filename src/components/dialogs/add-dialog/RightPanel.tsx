import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Music, Film, Scissors } from 'lucide-react'
import { EnhancementsSection } from './EnhancementsSection'
import { SelectDownloadType } from '../../common'
import { ClipSection } from './ClipSection'
import { ChoiceGroup } from '../../common'
import { useAddDialogContext } from './AddDialogContext'

// --- 1. KOMPONEN TAB TYPE ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DownloadTypeTabs({ mode, onChange, t }: { mode: 'video' | 'audio' | 'gif', onChange: (m: 'video' | 'audio' | 'gif') => void, t: any }) {

    // Dynamic color based on mode
    const activeColor = mode === 'audio' ? 'purple' : mode === 'gif' ? 'orange' : 'primary'

    return (
        <div className="mb-4">
            <ChoiceGroup
                variant="segment"
                activeColor={activeColor}
                value={mode}
                onChange={onChange}
                options={[
                    { value: 'video', label: t('dialog.tabs.video'), icon: Monitor },
                    { value: 'audio', label: t('dialog.tabs.audio'), icon: Music },
                    { value: 'gif', label: 'GIF', icon: Film }
                ]}
            />
        </div>
    )
}

export function RightPanel() {
    const {
        hasMeta, t,
        options, setters,
    } = useAddDialogContext()

    if (!hasMeta) return null

    // Derived Mode State
    const mode = options.format === 'audio' ? 'audio' : options.format === 'gif' ? 'gif' : 'video'

    const handleModeChange = (m: 'video' | 'audio' | 'gif') => {
        if (m === 'audio') setters.setFormat('audio')
        else if (m === 'gif') setters.setFormat('gif')
        else setters.setFormat('Best')
    }

    return (
        <div className="flex-1 min-w-0 relative z-0 flex flex-col bg-transparent dark:bg-black/20 panel-right">
            <div className="flex-1 p-6 space-y-6 min-w-[300px]">

                {/* 1. Global Tabs */}
                <DownloadTypeTabs mode={mode} onChange={handleModeChange} t={t} />

                {/* 2. Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-6"
                    >
                        <SelectDownloadType />

                        {!options.batchMode && (mode === 'video' || mode === 'gif' || mode === 'audio') && (
                            <div className="pt-4 border-t border-border dark:border-white/5 space-y-3">
                                <ClipSection
                                    maxDuration={mode === 'gif' ? 30 : undefined}
                                />
                                {mode === 'gif' && (
                                    <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-500/5 p-3 rounded-lg border border-orange-500/10">
                                        <Scissors className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="font-bold uppercase tracking-wider text-[10px]">{t('dialog.gif_maker.trim_required') || "Trim Required"}</p>
                                            <p className="opacity-90">{t('dialog.gif_maker.trim_desc') || "GIF format requires trimming. Select a short clip (max 30 seconds)."}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <EnhancementsSection />




                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
