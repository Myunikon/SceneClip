import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { useAddDialogContext } from './add-dialog/AddDialogContext'
import { OptionCard, ChoiceGroup } from './CommonSettings'
import { cn } from '../lib/utils'

export function SelectDownloadType() {
    const {
        options, setters,
        availableResolutions, availableAudioBitrates,
        t
    } = useAddDialogContext()

    const { format, container, audioBitrate, audioFormat } = options
    const { setFormat, setContainer, setAudioBitrate, setAudioFormat } = setters

    const mode = format === 'audio' ? 'audio' : format === 'gif' ? 'gif' : 'video'

    // Audio Formats
    const audioFormats = useMemo(() => {
        return (availableAudioBitrates && availableAudioBitrates.length > 0)
            ? [
                { value: '320', label: 'Best Available', desc: t('dialog.quality_profiles.highest_quality') },
                ...availableAudioBitrates.map(rate => {
                    let desc = t('dialog.quality_profiles.standard')
                    if (rate >= 256) desc = t('dialog.quality_profiles.highest_quality')
                    if (rate <= 64) desc = t('dialog.quality_profiles.data_saver')

                    return { value: rate.toString(), label: `${rate} kbps`, desc }
                })
            ]
            : [
                { value: '320', label: 'Best (320k)', desc: t('dialog.quality_profiles.highest_quality') },
                { value: '256', label: '256 kbps', desc: t('dialog.quality_profiles.highest_quality') },
                { value: '192', label: '192 kbps', desc: t('dialog.quality_profiles.standard') },
                { value: '128', label: '128 kbps', desc: t('dialog.quality_profiles.data_saver') },
            ]
    }, [availableAudioBitrates, t])

    const bestOption = useMemo(() => ({
        value: 'Best',
        label: t('dialog.formats.best'),
        icon: "/BestQuality.png",
        desc: t('dialog.quality_profiles.highest_quality')
    }), [t])

    // Video Formats
    const resolutionOptions = useMemo(() => {
        return (availableResolutions && availableResolutions.length > 0)
            ? availableResolutions
                .filter(h => h >= 144)
                .map(h => {
                    const label = `${h}p`
                    let desc = t('dialog.quality_profiles.standard')
                    if (h >= 1440) { desc = t('dialog.quality_profiles.ultra_hd') }
                    else if (h < 480) { desc = t('dialog.quality_profiles.data_saver') }
                    return { value: `${h}p`, label, desc }
                })
            : [
                { value: '1080p', label: '1080p', desc: t('dialog.quality_profiles.full_hd') },
                { value: '720p', label: '720p', desc: t('dialog.quality_profiles.hd') },
                { value: '480p', label: '480p', desc: t('dialog.quality_profiles.standard') },
            ]
    }, [availableResolutions, t])

    return (
        <div className="space-y-4 p-1">
            {mode === 'gif' ? (
                <div className="space-y-4">
                    <OptionCard title={t('dialog.gif_options.res_title')} description={t('dialog.gif_options.res_desc')}>
                        <ChoiceGroup
                            variant="scroll"
                            value={options.gifScale}
                            onChange={setters.setGifScale}
                            options={[
                                { value: 480, label: "High (480p)" },
                                { value: 320, label: "Medium (320p)" },
                                { value: 240, label: "Low (240p)" },
                            ]}
                        />
                        <div className="text-[10px] text-yellow-500/80 bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10 flex items-center gap-2">
                            <span className="shrink-0">⚠️</span>
                            <span>GIFs are limited to 480p to prevent huge file sizes and crashes.</span>
                        </div>
                    </OptionCard>

                    <OptionCard title={t('dialog.gif_options.fps_title')} description={t('dialog.gif_options.fps_desc')}>
                        <ChoiceGroup
                            variant="scroll"
                            value={options.gifFps}
                            onChange={setters.setGifFps}
                            options={[
                                { value: 30, label: t('dialog.gif_options.fps_smooth') },
                                { value: 15, label: t('dialog.gif_options.fps_standard') },
                                { value: 10, label: t('dialog.gif_options.fps_lite') },
                            ]}
                        />
                    </OptionCard>

                    <OptionCard
                        title={t('dialog.gif_options.quality_title')}
                        description={options.gifQuality === 'high' ? "Uses Palette Generation (Sharp colors)" : "Standard dithering (Fast render)"}
                    >
                        <ChoiceGroup
                            value={options.gifQuality}

                            onChange={(val) => setters.setGifQuality(val as 'high' | 'fast')}
                            options={[
                                { value: 'high', label: t('dialog.gif_options.quality_high'), recommended: true },
                                { value: 'fast', label: t('dialog.gif_options.quality_fast') },
                            ]}
                        />
                    </OptionCard>
                </div>
            ) : mode === 'audio' ? (
                <div className="space-y-4">
                    <OptionCard title={t('dialog.audio_extraction.title')} description="Higher bitrate means clearer sound details.">
                        <div className="space-y-3">
                            <BestOptionButton
                                isSelected={audioBitrate === '320'}
                                onClick={() => setAudioBitrate('320')}
                                label="Best Audio"
                                desc={t('dialog.quality_profiles.highest_quality') + " (320kbps)"}
                                icon={bestOption.icon} // Sync with video icon
                                variant="audio"
                            />

                            <ChoiceGroup
                                value={audioBitrate}

                                onChange={(val) => setAudioBitrate(val)}
                                columns={2}
                                options={audioFormats.filter(f => f.value !== '320').map(f => ({
                                    value: f.value,
                                    label: f.label,
                                    desc: f.desc,
                                    recommended: f.value === '320' || f.label.includes('Best')
                                }))}
                            />
                        </div>
                    </OptionCard>

                    <OptionCard
                        title="Audio Format"
                        description={audioFormat === 'mp3' ? "Universal (Music/Podcast)" :
                            audioFormat === 'm4a' ? "Efficient (Apple/Mobile)" :
                                audioFormat === 'flac' ? "Lossless (Audiophile)" :
                                    audioFormat === 'wav' ? "Uncompressed (Editing)" :
                                        "Select Format"}
                    >
                        <ChoiceGroup
                            variant="scroll"
                            value={audioFormat}

                            onChange={(val) => setAudioFormat(val)}
                            options={['mp3', 'm4a', 'flac', 'wav'].map(c => ({ value: c, label: c.toUpperCase() }))}
                        />
                    </OptionCard>
                </div>
            ) : (
                <div className="space-y-4">
                    <OptionCard
                        title={t('dialog.video_quality.title') || "Video Quality"}
                        description={t('dialog.video_quality.desc') || "Higher quality means larger file size."}
                    >
                        <div className="space-y-3">
                            {/* 1. Best Option - Standalone, Prominent */}
                            <BestOptionButton
                                isSelected={format === 'Best'}
                                onClick={() => setFormat('Best')}
                                label={bestOption.label}
                                desc={bestOption.desc}
                                icon={bestOption.icon}
                            />

                            {/* 2. Resolutions - Compact Grid */}
                            <ChoiceGroup
                                value={format}
                                onChange={setFormat}
                                columns={4}
                                options={resolutionOptions}
                            />
                        </div>
                    </OptionCard>

                    {/* OUTPUT FORMAT */}
                    <OptionCard
                        title={t('dialog.output_format.title') || "Output Format"}
                        description={container === 'mp4' ? t('dialog.output_format.desc_mp4') :
                            container === 'mkv' ? t('dialog.output_format.desc_mkv') :
                                container === 'webm' ? t('dialog.output_format.desc_webm') :
                                    container === 'mov' ? t('dialog.output_format.desc_mov') :
                                        t('dialog.output_format.desc_default')}
                    >
                        <ChoiceGroup
                            variant="scroll"
                            value={container}
                            onChange={setContainer}
                            options={['mp4', 'mkv', 'webm', 'mov'].map(c => ({ value: c, label: c.toUpperCase() }))}
                        />
                    </OptionCard>

                    {/* VIDEO CODEC - Moved from Enhancements */}
                    <OptionCard
                        title={t('dialog.video_codec') || "Video Codec"}
                        description={t('dialog.codec_desc') || "AV1 is best, H264 is most compatible"}
                    >
                        <ChoiceGroup
                            variant="scroll"
                            value={options.videoCodec || 'auto'}

                            onChange={(val) => setters.setVideoCodec(val)}
                            options={[
                                { value: 'auto', label: 'Auto' },
                                { value: 'av1', label: 'AV1' },
                                { value: 'vp9', label: 'VP9' },
                                { value: 'h264', label: 'H264' },
                            ]}
                        />
                    </OptionCard>
                </div>
            )}
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BestOptionButton({ isSelected, onClick, label, desc, icon, variant = 'video' }: any) {
    const gradientClass = variant === 'audio'
        ? "bg-gradient-to-r from-[#a554f6] to-[#5046e5]"
        : "bg-gradient-to-r from-yellow-500 to-[#ff6f67]"

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full relative flex items-center gap-4 p-4 rounded-xl transition-all text-left group overflow-hidden shadow-xl",
                isSelected
                    ? gradientClass
                    : "bg-card border border-border hover:bg-secondary/50"
            )}
        >
            <div className={cn(
                "shrink-0 transition-colors flex items-center justify-center relative",
                typeof icon === 'string'
                    ? "w-20 h-20 -my-4 -ml-2"
                    : cn("p-3 rounded-xl bg-white/10 text-white")
            )}>
                {typeof icon === 'string' ? (
                    <img
                        src={icon}
                        alt="Best"
                        className="w-full h-full object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-300"
                        style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}
                    />
                ) : (
                    <Sparkles className="w-5 h-5" />
                )}
            </div>
            <div className="flex-1 min-w-0 z-10">
                <div className={cn("font-bold text-sm mb-0.5", isSelected ? "text-white" : "")}>{label}</div>
                <div className={cn("text-xs", isSelected ? "text-white/80" : "text-muted-foreground")}>{desc}</div>
            </div>
        </button>
    )
}
