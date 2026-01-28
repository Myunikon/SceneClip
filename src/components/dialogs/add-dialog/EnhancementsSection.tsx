import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, ChevronDown } from 'lucide-react'
import { isYouTubeUrl } from '../../../lib/validators'
import { useAddDialogContext } from './AddDialogContext'
import { cn } from '../../../lib/utils'

// Sub-components
import { SponsorBlockSettings } from './enhancements/SponsorBlockSettings'
import { AudioNormalizationSettings } from './enhancements/AudioNormalizationSettings'
import { SplitChaptersSettings } from './enhancements/SplitChaptersSettings'
import { ScheduleSettings } from './enhancements/ScheduleSettings'
import { SubtitlesSettings } from './enhancements/SubtitlesSettings'
import { PostProcessingSettings } from './enhancements/PostProcessingSettings'

export function EnhancementsSection() {
    const {
        url, meta, t,
        options, setters,
        availableLanguages,
        settings
    } = useAddDialogContext()
    const [isOpen, setIsOpen] = useState(false)

    // Helper Variables for Cleaner Rendering Logic
    const isGif = options.format === 'gif'
    const isYouTube = isYouTubeUrl(url)

    // Feature availability checks
    const supportsSponsorBlock = isYouTube && !isGif
    const supportsSubtitles = (isYouTube || !!meta?.subtitles) && !isGif // Allow for Youtube generally or if subtitles exist
    const supportsAudioNorm = !isGif
    const supportsChapters = isYouTube && (meta?.chapters ? meta.chapters.length > 0 : false) && !isGif

    return (
        <div className="pt-4 border-t border-white/5">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between group py-2"
            >
                <h4 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                    <Settings className="w-3 h-3" /> {t('dialog.enhancements_label')}
                </h4>
                <div className={cn("p-1 rounded-md transition-all", isOpen ? "bg-white/10 text-foreground rotate-180" : "text-muted-foreground group-hover:bg-white/5")}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-3">
                            {/* 1. SponsorBlock (High Usage) */}
                            {supportsSponsorBlock && (
                                <SponsorBlockSettings
                                    t={t}
                                    checked={options.sponsorBlock}
                                    onChange={setters.setSponsorBlock}
                                    disabled={options.isClipping}
                                    disabledReason={t('dialog.sponsor_clip_conflict')}
                                />
                            )}

                            {/* 2. Subtitles (High Usage) */}
                            {supportsSubtitles && (
                                <SubtitlesSettings
                                    t={t}
                                    checked={options.subtitles}
                                    onChange={setters.setSubtitles}
                                    disabled={meta?.hasSubtitles === false}
                                    availableLanguages={availableLanguages || []}
                                    subtitleLang={options.subtitleLang}
                                    setSubtitleLang={setters.setSubtitleLang}
                                    embedSubtitles={options.embedSubtitles}
                                    setEmbedSubtitles={setters.setEmbedSubtitles}
                                    subtitleFormat={options.subtitleFormat}
                                    setSubtitleFormat={setters.setSubtitleFormat}
                                />
                            )}

                            {/* 3. Loudness Normalization (Medium) */}
                            {supportsAudioNorm && (
                                <AudioNormalizationSettings
                                    t={t}
                                    checked={options.audioNormalization}
                                    onChange={setters.setAudioNormalization}
                                />
                            )}

                            {/* 4. Split Chapters (Medium) - Sequential to normalization if both checked */}
                            {supportsChapters && (
                                <SplitChaptersSettings
                                    t={t}
                                    checked={options.splitChapters}
                                    onChange={setters.setSplitChapters}
                                    showSequentialModeDesc={options.audioNormalization && options.splitChapters}
                                />
                            )}

                            {/* 5. Post-Processing Presets (Advanced) */}
                            <PostProcessingSettings
                                t={t}
                                checked={!!options.postProcessorArgs}
                                onChange={(v) => !v && setters.setPostProcessorArgs?.('')}
                                postProcessorArgs={options.postProcessorArgs}
                                setPostProcessorArgs={setters.setPostProcessorArgs || (() => { })}
                                presets={settings?.postProcessorPresets || []}
                                currentFormat={options.format}
                            />

                            {/* 6. Schedule Download (Low Usage) */}
                            <ScheduleSettings
                                t={t}
                                checked={options.isScheduled}
                                onCheckedChange={setters.setIsScheduled}
                                scheduleTime={options.scheduleTime}
                                onScheduleTimeChange={setters.setScheduleTime}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
