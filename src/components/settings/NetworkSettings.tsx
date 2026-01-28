import { useTranslation } from 'react-i18next'
import { Switch } from '../ui'
import { Slider } from '../ui'
import { AppSettings } from '../../store/slices/types'
import { SettingItem, SettingSection } from './SettingItem'

interface NetworkSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

export function NetworkSettings({ settings, setSetting }: NetworkSettingsProps) {
    const { t } = useTranslation()
    return (
        <div className="space-y-4">
            <SettingSection title={t('settings.network.connection')}>
                <div className="space-y-6">
                    {/* Concurrent Downloads - SLIDER */}
                    <SettingItem title={t('settings.network.concurrent')} layout="vertical">
                        <div className="flex items-center gap-4 px-1">
                            <div className="flex-1">
                                <Slider
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={settings.concurrentDownloads}
                                    onChange={(val) => setSetting('concurrentDownloads', val)}
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground px-1 mt-1 font-mono">
                                    <span>1</span>
                                    <span>5</span>
                                    <span>10</span>
                                </div>
                            </div>
                            <div className="w-12 text-center">
                                <span className="text-base font-medium font-mono border-b border-border/50 px-2 py-0.5">{settings.concurrentDownloads}</span>
                            </div>
                        </div>
                    </SettingItem>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Speed Limit */}
                        <SettingItem title={t('settings.network.speed_limit')} layout="vertical">
                            <div className="relative">
                                <input
                                    className="w-full p-2.5 rounded-lg border border-input bg-background/80 font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                    value={settings.speedLimit}
                                    onChange={(e) => setSetting('speedLimit', e.target.value)}
                                    placeholder="0"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                    KB/s
                                </div>
                            </div>
                        </SettingItem>

                        {/* User Agent */}
                        <SettingItem title={t('settings.network.user_agent')} layout="vertical">
                            <input
                                className="w-full p-2.5 rounded-lg border border-input bg-background/80 font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                                value={settings.userAgent || ''}
                                onChange={(e) => setSetting('userAgent', e.target.value)}
                                placeholder={t('settings.network.placeholders.ua') || "Default Chrome"}
                            />
                        </SettingItem>
                    </div>

                    {/* Proxy */}
                    <SettingItem title={t('settings.network.proxy') || "Proxy Server"} layout="vertical">
                        <input
                            className="w-full p-2.5 rounded-lg border border-input bg-background/80 font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                            value={settings.proxy}
                            onChange={(e) => setSetting('proxy', e.target.value)}
                            placeholder="http://127.0.0.1:8080"
                        />
                    </SettingItem>
                </div>
            </SettingSection>

            {/* Downloader Engine - Clean List Style */}
            <SettingSection title={t('settings.network.aria2c_section') || "Downloader Engine"}>
                <SettingItem
                    title={t('settings.network.aria2c_title') || "Use Aria2c"}
                    description={t('settings.network.aria2c_desc')}
                    className="px-1"
                >
                    <Switch
                        checked={settings.useAria2c}
                        onCheckedChange={(val) => setSetting('useAria2c', val)}
                    />
                </SettingItem>
            </SettingSection>
        </div>
    )
}
