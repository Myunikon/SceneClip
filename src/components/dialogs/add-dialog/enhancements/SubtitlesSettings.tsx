import React from 'react'
import { MessageSquare, Subtitles } from 'lucide-react'
import { SettingCard, ChoiceGroup } from '../../../common'
import { Switch } from '../../../ui'
import { cn } from '../../../../lib/utils'

interface SubtitlesSettingsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    availableLanguages: { id: string; label: string }[]
    subtitleLang: string
    setSubtitleLang: (lang: string) => void
    embedSubtitles: boolean
    setEmbedSubtitles: (embed: boolean) => void
    subtitleFormat?: string
    setSubtitleFormat: (format: string | undefined) => void
}

export const SubtitlesSettings: React.FC<SubtitlesSettingsProps> = ({
    t,
    checked,
    onChange,
    disabled,
    availableLanguages,
    subtitleLang,
    setSubtitleLang,
    embedSubtitles,
    setEmbedSubtitles,
    subtitleFormat,
    setSubtitleFormat
}) => {

    const handleClick = async () => {
        const newVal = !checked;
        if (newVal) {
            const { notify } = await import('../../../../lib/notify');
            notify.info(t('dialog.subtitle_safe_mode_title'), {
                description: t('dialog.subtitle_safe_mode_desc')
            });
        }
        onChange(newVal);
    }

    return (
        <SettingCard
            icon={<MessageSquare className="w-4 h-4" />}
            title={t('dialog.subtitles_title')}
            description={disabled ? t('dialog.not_available') : t('dialog.subtitles_desc')}
            checked={checked}
            onCheckedChange={onChange}
            disabled={disabled}
            onClick={handleClick}
            expandableContent={
                <div className="p-3 space-y-3">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-muted-foreground">
                        <MessageSquare className="w-3 h-3" /> {t('dialog.subtitle_settings')}
                    </div>
                    <div className="space-y-4">
                        <ChoiceGroup
                            variant="scroll"
                            value={subtitleLang}
                            onChange={setSubtitleLang}
                            options={(availableLanguages || []).map((lang) => ({
                                value: lang.id,
                                label: lang.label
                            }))}
                            activeColor="primary"
                        />

                        <div
                            onClick={() => setEmbedSubtitles(!embedSubtitles)}
                            className="flex items-center justify-between p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("p-1.5 rounded-lg", embedSubtitles ? "bg-foreground text-background" : "bg-white/10 text-muted-foreground")}>
                                    <Subtitles className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold leading-none">{t('dialog.embed_subs')}</div>
                                    <div className="text-[10px] text-muted-foreground mt-1">{t('dialog.inside_video')}</div>
                                </div>
                            </div>
                            <Switch checked={embedSubtitles} onCheckedChange={setEmbedSubtitles} className="data-[state=checked]:bg-white scale-90" />
                        </div>

                        {!embedSubtitles && (
                            <div className="space-y-2 pt-1 border-t border-white/5">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase pl-1">{t('dialog.labels.fmt')}</div>
                                <ChoiceGroup
                                    value={subtitleFormat}
                                    onChange={setSubtitleFormat}
                                    options={[
                                        { value: undefined, label: 'Original' },
                                        { value: 'srt', label: 'SRT' },
                                        { value: 'ass', label: 'ASS' },
                                    ]}
                                    activeColor="primary" // Default/Neutral
                                />
                            </div>
                        )}
                    </div>
                </div>
            }
        />
    )
}
