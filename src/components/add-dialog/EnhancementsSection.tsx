import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Settings, AlertCircle, Music, List, Calendar, Clock, MessageSquare, Subtitles, ChevronDown
} from 'lucide-react'
import { Switch } from '../Switch'
import { CustomDateTimePicker } from '../CustomDateTimePicker'
import { SettingCard, ChoiceGroup } from '../CommonSettings'
import { isYouTubeUrl } from '../../lib/validators'
import { useAddDialogContext } from './AddDialogContext'
import { cn } from '../../lib/utils'

export function EnhancementsSection() {
    const {
        url, meta, t,
        options, setters,
        availableLanguages
    } = useAddDialogContext()
    const [isOpen, setIsOpen] = useState(false)

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
                            {/* SponsorBlock */}
                            {options.format !== 'gif' && isYouTubeUrl(url) && (
                                <SettingCard
                                    icon={<AlertCircle className="w-4 h-4" />}
                                    title={t('dialog.remove_sponsors')}
                                    description={t('dialog.remove_sponsors_desc')}
                                    checked={options.sponsorBlock}
                                    onCheckedChange={setters.setSponsorBlock}
                                    activeColor="red"
                                    disabled={options.isClipping}
                                    disabledReason={t('dialog.sponsor_clip_conflict')}
                                />
                            )}

                            {/* Loudness Normalization */}
                            {options.format !== 'gif' && (
                                <SettingCard
                                    icon={<Music className="w-4 h-4" />}
                                    title={t('dialog.loudness_normalization') || "Loudness Norm."}
                                    description={t('dialog.loudness_desc') || "EBU R128 Standard"}
                                    checked={options.audioNormalization}
                                    onCheckedChange={setters.setAudioNormalization}
                                    activeColor="orange"
                                />
                            )}

                            {/* Split Chapters */}
                            {options.format !== 'gif' && isYouTubeUrl(url) && (meta?.chapters && meta.chapters.length > 0) && (
                                <SettingCard
                                    icon={<List className="w-4 h-4" />}
                                    title={t('dialog.split_chapters') || 'Split Chapters'}
                                    description={options.audioNormalization && options.splitChapters ? (t('dialog.sequential_mode') || "Sequential Mode: Will split after download") : undefined}
                                    checked={options.splitChapters}
                                    onCheckedChange={setters.setSplitChapters}
                                    activeColor="red"
                                />
                            )}
                        </div>

                        {/* Full width items */}
                        <div className="space-y-3 mt-3">
                            {/* Schedule Download */}
                            <SettingCard
                                icon={<Calendar className="w-4 h-4" />}
                                title={t('dialog.schedule_download')}
                                description={t('dialog.schedule_desc') || "Start task automatically at a later time"}
                                checked={options.isScheduled}
                                onCheckedChange={setters.setIsScheduled}
                                activeColor="orange"
                                expandableContent={
                                    <div className="p-3 space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-orange-400">
                                            <Clock className="w-3 h-3" /> {t('dialog.schedule_time')}
                                        </div>
                                        <CustomDateTimePicker
                                            value={options.scheduleTime}
                                            onChange={setters.setScheduleTime}
                                            t={t}
                                        />
                                    </div>
                                }
                            />

                            {/* Subtitles */}
                            {options.format !== 'audio' && options.format !== 'gif' && (
                                <SettingCard
                                    icon={<MessageSquare className="w-4 h-4" />}
                                    title={t('dialog.subtitles_title')}
                                    description={meta?.hasSubtitles === false ? (t('dialog.not_available') || "Not available") : t('dialog.subtitles_desc') || "Embed or download subtitles"}
                                    checked={options.subtitles}
                                    onCheckedChange={setters.setSubtitles}
                                    activeColor="red"
                                    disabled={meta?.hasSubtitles === false}
                                    onClick={async () => {
                                        const newVal = !options.subtitles;
                                        if (newVal) {
                                            const { notify } = await import('../../lib/notify');
                                            notify.info(t('dialog.subtitle_safe_mode_title') || "Safe Mode Active", {
                                                description: t('dialog.subtitle_safe_mode_desc') || "Subtitle downloads are slowed down to prevent YouTube blocking (HTTP 429)."
                                            });
                                        }
                                        setters.setSubtitles(newVal);
                                    }}
                                    expandableContent={
                                        <div className="p-3 space-y-3">
                                            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-red-400">
                                                <MessageSquare className="w-3 h-3" /> {t('dialog.subtitle_settings')}
                                            </div>
                                            <div className="space-y-4">
                                                <ChoiceGroup
                                                    variant="scroll"
                                                    value={options.subtitleLang}
                                                    onChange={setters.setSubtitleLang}
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    options={(availableLanguages || []).map((lang: any) => ({
                                                        value: lang.id,
                                                        label: lang.label
                                                    }))}
                                                    activeColor="purple"
                                                />

                                                <div
                                                    onClick={() => setters.setEmbedSubtitles(!options.embedSubtitles)}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-1.5 rounded-lg", options.embedSubtitles ? "bg-red-500 text-white" : "bg-white/10 text-muted-foreground")}>
                                                            <Subtitles className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold leading-none">{t('dialog.embed_subs')}</div>
                                                            <div className="text-[10px] text-muted-foreground mt-1">{t('dialog.inside_video') || "Inside video file"}</div>
                                                        </div>
                                                    </div>
                                                    <Switch checked={options.embedSubtitles} onCheckedChange={setters.setEmbedSubtitles} className="data-[state=checked]:bg-red-500 scale-90" />
                                                </div>

                                                {!options.embedSubtitles && (
                                                    <div className="space-y-2 pt-1 border-t border-white/5">
                                                        <div className="text-[10px] font-bold text-muted-foreground uppercase pl-1">{t('dialog.labels.fmt') || "Format:"}</div>
                                                        <ChoiceGroup
                                                            value={options.subtitleFormat}
                                                            onChange={setters.setSubtitleFormat}
                                                            options={[
                                                                { value: undefined, label: 'Original' },
                                                                { value: 'srt', label: 'SRT' },
                                                                { value: 'ass', label: 'ASS' },
                                                            ]}
                                                            activeColor="red"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    }
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
