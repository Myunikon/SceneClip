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
                { value: '320', label: 'Best Available', desc: t.quality_profiles.highest_quality },
                ...availableAudioBitrates.map(rate => {
                    let desc = t.quality_profiles.standard
                    if (rate >= 256) desc = t.quality_profiles.highest_quality
                    if (rate <= 64) desc = t.quality_profiles.data_saver

                    return { value: rate.toString(), label: `${rate} kbps`, desc }
                })
            ]
            : [
                { value: '320', label: 'Best (320k)', desc: t.quality_profiles.highest_quality },
                { value: '256', label: '256 kbps', desc: t.quality_profiles.highest_quality },
                { value: '192', label: '192 kbps', desc: t.quality_profiles.standard },
                { value: '128', label: '128 kbps', desc: t.quality_profiles.data_saver },
            ]
    }, [availableAudioBitrates, t])

    const bestOption = useMemo(() => ({ value: 'Best', label: t.formats.best, icon: Sparkles, desc: t.quality_profiles.highest_quality }), [t])

    // Video Formats
    const resolutionOptions = useMemo(() => {
        return (availableResolutions && availableResolutions.length > 0)
            ? availableResolutions
                .filter(h => h >= 144)
                .map(h => {
                    let label = `${h}p`
                    let desc = t.quality_profiles.standard
                    if (h >= 1440) { desc = t.quality_profiles.ultra_hd }
                    else if (h < 480) { desc = t.quality_profiles.data_saver }
                    return { value: `${h}p`, label, desc }
                })
            : [
                { value: '1080p', label: '1080p', desc: t.quality_profiles.full_hd },
                { value: '720p', label: '720p', desc: t.quality_profiles.hd },
                { value: '480p', label: '480p', desc: t.quality_profiles.standard },
            ]
    }, [availableResolutions, t])

    return (
        <div className="space-y-4 p-1">
            {mode === 'gif' ? (
                <div className="space-y-4">
                    <OptionCard title={t.gif_options?.res_title} description={t.gif_options?.res_desc}>
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

                    <OptionCard title={t.gif_options?.fps_title} description={t.gif_options?.fps_desc}>
                        <ChoiceGroup
                            variant="scroll"
                            value={options.gifFps}
                            onChange={setters.setGifFps}
                            options={[
                                { value: 30, label: t.gif_options?.fps_smooth },
                                { value: 15, label: t.gif_options?.fps_standard },
                                { value: 10, label: t.gif_options?.fps_lite },
                            ]}
                        />
                    </OptionCard>

                    <OptionCard
                        title={t.gif_options?.quality_title}
                        description={options.gifQuality === 'high' ? "Uses Palette Generation (Sharp colors)" : "Standard dithering (Fast render)"}
                    >
                        <ChoiceGroup
                            value={options.gifQuality}
                            onChange={setters.setGifQuality as any}
                            options={[
                                { value: 'high', label: t.gif_options?.quality_high, recommended: true },
                                { value: 'fast', label: t.gif_options?.quality_fast },
                            ]}
                        />
                    </OptionCard>
                </div>
            ) : mode === 'audio' ? (
                <div className="space-y-4">
                    <OptionCard title={t.audio_extraction.title} description="Higher bitrate means clearer sound details.">
                        <ChoiceGroup
                            value={audioBitrate}
                            onChange={setAudioBitrate as any}
                            columns={2}
                            options={audioFormats.map(f => ({
                                value: f.value,
                                label: f.label,
                                desc: f.desc,
                                recommended: f.value === '320' || f.label.includes('Best')
                            }))}
                        />
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
                            onChange={setAudioFormat as any}
                            options={['mp3', 'm4a', 'flac', 'wav'].map(c => ({ value: c, label: c.toUpperCase() }))}
                        />
                    </OptionCard>
                </div>
            ) : (
                <div className="space-y-4">
                    <OptionCard
                        title={t.video_quality?.title || "Video Quality"}
                        description={t.video_quality?.desc || "Higher quality means larger file size."}
                    >
                        <div className="space-y-3">
                            {/* 1. Best Option - Standalone, Prominent */}
                            <button
                                type="button"
                                onClick={() => setFormat('Best')}
                                className={cn(
                                    "w-full relative flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                                    format === 'Best'
                                        ? "bg-primary/10 border-primary/50 ring-1 ring-inset ring-primary/50 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]"
                                        : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10"
                                )}
                            >
                                <div className={cn(
                                    "p-3 rounded-xl shrink-0 transition-colors",
                                    format === 'Best' ? "bg-primary text-white" : "bg-white/10 text-muted-foreground group-hover:text-foreground"
                                )}>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm mb-0.5">{bestOption.label}</div>
                                    <div className="text-xs text-muted-foreground">{bestOption.desc}</div>
                                </div>
                                {format === 'Best' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm mr-2" />
                                )}
                            </button>

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
                        title={t.output_format?.title || "Output Format"}
                        description={container === 'mp4' ? t.output_format?.desc_mp4 :
                            container === 'mkv' ? t.output_format?.desc_mkv :
                                container === 'webm' ? t.output_format?.desc_webm :
                                    container === 'mov' ? t.output_format?.desc_mov :
                                        t.output_format?.desc_default}
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
                        title={t.video_codec || "Video Codec"}
                        description={t.codec_desc || "AV1 is best, H264 is most compatible"}
                    >
                        <ChoiceGroup
                            variant="scroll"
                            value={options.videoCodec}
                            onChange={setters.setVideoCodec as any}
                            options={[
                                { value: undefined, label: 'Auto' },
                                { value: 'av01', label: 'AV1' },
                                { value: 'vp09', label: 'VP9' },
                                { value: 'h264', label: 'H264' },
                            ]}
                        />
                    </OptionCard>
                </div>
            )}
        </div>
    )
}
