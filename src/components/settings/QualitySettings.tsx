import { Select } from '../Select'
import { Switch } from '../Switch'
import { AppSettings } from '../../store/slices/types'

interface QualitySettingsProps {
    settings: AppSettings
    setSetting: (key: string, val: any) => void
    t: any
}

export function QualitySettings({ settings, setSetting, t }: QualitySettingsProps) {
    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {/* Video Content Section */}
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg">
                    {t.settings.quality?.video || "Video Content"}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">{t.settings.quality?.resolution || "Default Resolution"}</label>
                        <Select
                            value={settings.resolution}
                            onChange={(val) => setSetting('resolution', val)}
                            options={[
                                { value: 'best', label: t.settings.quality?.best || "Best Available" },
                                { value: '2160', label: '4K (2160p)' },
                                { value: '1440', label: '2K (1440p)' },
                                { value: '1080', label: 'Full HD (1080p)' },
                                { value: '720', label: 'HD (720p)' },
                                { value: '480', label: 'SD (480p)' },
                                { value: 'audio', label: t.settings.quality?.audio || "Audio Only" }
                            ]}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">{t.settings.quality?.container || "Container (Format)"}</label>
                        <Select
                            value={settings.container}
                            onChange={(val) => setSetting('container', val)}
                            options={[
                                { value: 'mp4', label: 'MP4 (Universal)' },
                                { value: 'mkv', label: 'MKV (Advanced)' },
                                { value: 'webm', label: 'WebM (Google)' },
                                { value: 'mov', label: 'QuickTime (MOV)' }
                            ]}
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors">
                        <div className="space-y-0.5">
                            <span className="text-sm font-medium">{t.settings.quality?.sponsorblock || "SponsorBlock"}</span>
                            <p className="text-xs text-muted-foreground">Auto-skip ads, intros, and outros</p>
                        </div>
                        <Switch
                            checked={settings.useSponsorBlock}
                            onCheckedChange={(val) => setSetting('useSponsorBlock', val)}
                        />
                    </label>
                </div>
            </section>

            {/* Audio Section */}
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg">
                    {t.settings.quality?.audio || "Audio Processing"}
                </h3>
                <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="space-y-0.5">
                        <span className="text-sm font-medium">{t.settings.quality?.audio_normalization || "Loudness Normalization"}</span>
                        <p className="text-xs text-muted-foreground">EBU R128 Standard</p>
                    </div>
                    <Switch
                        checked={settings.audioNormalization}
                        onCheckedChange={(val) => setSetting('audioNormalization', val)}
                    />
                </label>
            </section>

            {/* Metadata Section */}
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg">
                    {t.settings.quality?.metadata || "Metadata & Tags"}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors">
                        <span className="text-sm">{t.settings.quality?.embed_metadata}</span>
                        <Switch checked={settings.embedMetadata} onCheckedChange={(val) => setSetting('embedMetadata', val)} />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors">
                        <span className="text-sm">{t.settings.quality?.embed_thumbnail}</span>
                        <Switch checked={settings.embedThumbnail} onCheckedChange={(val) => setSetting('embedThumbnail', val)} />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors">
                        <span className="text-sm">{t.settings.quality?.embed_chapters}</span>
                        <Switch checked={settings.embedChapters} onCheckedChange={(val) => setSetting('embedChapters', val)} />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors">
                        <span className="text-sm">{t.settings.quality?.disable_play_button}</span>
                        <Switch checked={settings.disablePlayButton} onCheckedChange={(val) => setSetting('disablePlayButton', val)} />
                    </label>
                </div>
            </section>
        </div>
    )
}
