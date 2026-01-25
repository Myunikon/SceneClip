import { useTranslation, Trans } from 'react-i18next'
import { Select } from '../Select'
import { Switch } from '../Switch'
import { AppSettings } from '../../store/slices/types'
import { SettingItem, SettingSection } from './SettingItem'

interface QualitySettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

export function QualitySettings({ settings, setSetting }: QualitySettingsProps) {
    const { t } = useTranslation()

    return (
        <div className="space-y-4">
            {/* Video Content Section */}
            <SettingSection title={t('settings.quality.video')}>
                <div className="grid grid-cols-2 gap-4">
                    <SettingItem title={t('settings.quality.resolution')} layout="vertical">
                        <Select
                            value={settings.resolution}
                            onChange={(val) => setSetting('resolution', val)}
                            options={[
                                { value: 'best', label: t('settings.downloads.best') || "Best Available" },
                                { value: '2160', label: '4K (2160p)' },
                                { value: '1440', label: '2K (1440p)' },
                                { value: '1080', label: 'Full HD (1080p)' },
                                { value: '720', label: 'HD (720p)' },
                                { value: '480', label: 'SD (480p)' },
                                { value: 'audio', label: t('settings.quality.audio') || "Audio Only" }
                            ]}
                        />
                    </SettingItem>
                    <SettingItem title={t('settings.quality.container')} layout="vertical">
                        <Select
                            value={settings.container}
                            onChange={(val) => setSetting('container', val as AppSettings['container'])}
                            options={[
                                { value: 'mp4', label: 'MP4 (Universal)' },
                                { value: 'mkv', label: 'MKV (Advanced)' },
                                { value: 'webm', label: 'WebM (Google)' },
                                { value: 'mov', label: 'QuickTime (MOV)' }
                            ]}
                        />
                    </SettingItem>
                </div>

                <SettingItem
                    title={t('settings.quality.sponsorblock') || "SponsorBlock"}
                    description="Auto-skip ads, intros, and outros"
                    border
                    className="hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                >
                    <Switch
                        checked={settings.useSponsorBlock}
                        onCheckedChange={(val) => setSetting('useSponsorBlock', val)}
                    />
                </SettingItem>
            </SettingSection>

            {/* Audio Section */}
            <SettingSection title={t('settings.quality.audio') || "Audio Processing"}>
                <SettingItem
                    title={t('settings.quality.audio_normalization') || "Loudness Normalization"}
                    description="EBU R128 Standard"
                    className="hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                >
                    <Switch
                        checked={settings.audioNormalization}
                        onCheckedChange={(val) => setSetting('audioNormalization', val)}
                    />
                </SettingItem>
            </SettingSection>

            {/* Metadata Section */}
            <SettingSection title={t('settings.quality.metadata') || "Metadata & Tags"}>
                <div className="grid grid-cols-1 gap-2">
                    <SettingItem
                        title={t('settings.quality.embed_metadata')}
                        className="hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    >
                        <Switch checked={settings.embedMetadata} onCheckedChange={(val) => setSetting('embedMetadata', val)} />
                    </SettingItem>
                    <SettingItem
                        title={t('settings.quality.embed_thumbnail')}
                        className="hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    >
                        <Switch checked={settings.embedThumbnail} onCheckedChange={(val) => setSetting('embedThumbnail', val)} />
                    </SettingItem>
                    <SettingItem
                        title={t('settings.quality.embed_chapters')}
                        className="hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    >
                        <Switch checked={settings.embedChapters} onCheckedChange={(val) => setSetting('embedChapters', val)} />
                    </SettingItem>
                    <SettingItem
                        title={t('settings.quality.disable_play_button')}
                        className="hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    >
                        <Switch checked={settings.disablePlayButton} onCheckedChange={(val) => setSetting('disablePlayButton', val)} />
                    </SettingItem>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex gap-3 items-start">
                    <div className="text-yellow-500 shrink-0 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <strong className="text-yellow-500 block mb-0.5">{t('settings.quality.metadata_warning_title')}</strong>
                        <Trans i18nKey="settings.quality.metadata_warning_desc" components={{ 1: <strong /> }} />
                    </div>
                </div>
            </SettingSection>
        </div>
    )
}
