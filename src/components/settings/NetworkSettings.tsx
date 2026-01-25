import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Select } from '../Select'
import { AppSettings } from '../../store/slices/types'
import { SettingItem, SettingSection } from './SettingItem'

interface NetworkSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

export function NetworkSettings({ settings, setSetting }: NetworkSettingsProps) {
    const { t } = useTranslation()
    const activeProfile = settings.concurrentFragments === 1 ? 'safe'
        : settings.concurrentFragments === 4 ? 'fast'
            : settings.concurrentFragments >= 8 ? 'aggressive'
                : 'custom'

    return (
        <div className="space-y-4">
            <SettingSection title={t('settings.network.connection')}>
                <div className="grid grid-cols-2 gap-4">
                    <SettingItem title={t('settings.network.concurrent')} layout="vertical">
                        <input
                            type="number"
                            min="1"
                            max="10"
                            className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
                            value={settings.concurrentDownloads}
                            onChange={(e) => {
                                const val = parseInt(e.target.value)
                                if (!isNaN(val)) setSetting('concurrentDownloads', val)
                            }}
                        />
                    </SettingItem>
                    <SettingItem title={t('settings.network.speed_limit')} layout="vertical">
                        <input
                            className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
                            value={settings.speedLimit}
                            onChange={(e) => setSetting('speedLimit', e.target.value)}
                            placeholder={t('settings.network.placeholders.speed') || "0"}
                        />
                    </SettingItem>
                </div>

                <SettingItem title={t('settings.network.proxy') || "Proxy Server"} layout="vertical">
                    <input
                        className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
                        value={settings.proxy}
                        onChange={(e) => setSetting('proxy', e.target.value)}
                        placeholder={t('settings.network.placeholders.proxy') || "http://127.0.0.1:8080"}
                    />
                </SettingItem>
            </SettingSection>

            <SettingSection title={t('settings.network.performance')}>
                <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
                            <span className="flex items-center gap-2">{t('settings.network.concurrent_fragments')}</span>
                            <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded text-xs">
                                {t('settings.network.chunks_label').replace('{n}', String(settings.concurrentFragments || 4))}
                            </span>
                        </label>

                        <div className="bg-secondary/20 p-4 rounded-xl space-y-4 border border-border/50">
                            {/* Preset Selector */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('settings.network.perf_profile')}</label>
                                <Select
                                    value={activeProfile}
                                    onChange={(val) => {
                                        if (val === 'safe') setSetting('concurrentFragments', 1)
                                        else if (val === 'fast') setSetting('concurrentFragments', 4)
                                        else if (val === 'aggressive') setSetting('concurrentFragments', 8)
                                    }}
                                    options={[
                                        { value: 'safe', label: t('settings.network.perf_safe_title') || "Safe (1 Chunk)" },
                                        { value: 'fast', label: t('settings.network.perf_fast_title') || "Fast (4 Chunks)" },
                                        { value: 'aggressive', label: t('settings.network.perf_aggressive_title') || "Aggressive" },
                                        { value: 'custom', label: t('settings.network.custom') || "Custom" }
                                    ]}
                                />
                            </div>

                            <input
                                type="range"
                                min="1"
                                max="16"
                                step="1"
                                className="w-full accent-primary h-1.5 bg-[#ababad] hover:bg-[#59595b] dark:bg-white/10 rounded-lg appearance-none cursor-pointer transition-colors"
                                value={settings.concurrentFragments || 4}
                                onChange={(e) => setSetting('concurrentFragments', parseInt(e.target.value))}
                            />

                            <div className="text-xs text-muted-foreground space-y-2 border-t border-border/50 pt-3">
                                <p className="font-medium text-foreground/80 flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-yellow-500" />
                                    {t('settings.network.perf_tuning')}
                                </p>
                                <p className="opacity-80 leading-relaxed">
                                    {activeProfile === 'safe' && t('settings.network.perf_safe_desc')}
                                    {activeProfile === 'fast' && t('settings.network.perf_fast_desc')}
                                    {activeProfile === 'aggressive' && t('settings.network.perf_aggressive_desc')}
                                    {activeProfile === 'custom' && t('settings.network.manual_config')}
                                </p>
                                {activeProfile === 'aggressive' && (
                                    <p className="text-red-400/80 italic mt-1">
                                        {t('settings.network.perf_warning')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SettingSection>
        </div>
    )
}
