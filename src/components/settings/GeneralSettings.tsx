import { useTranslation } from 'react-i18next'
import { Select } from '../Select'
import { Switch } from '../Switch'
import { AppSettings } from '../../store/slices/types'
import { enable, disable } from '@tauri-apps/plugin-autostart'
import { SettingItem, SettingSection } from './SettingItem'

interface GeneralSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

export function GeneralSettings({ settings, setSetting }: GeneralSettingsProps) {
    const { t, i18n } = useTranslation()
    const handleAutostart = async (enabled: boolean) => {
        try {
            if (enabled) {
                await enable()
            } else {
                await disable()
            }
            setSetting('launchAtStartup', enabled)
        } catch (e) {
            console.error('Autostart toggle failed:', e)
        }
    }

    return (
        <div className="space-y-4">
            <SettingSection title={t('settings.general.language_theme')}>
                <div className="flex flex-col gap-5">
                    {/* 1. Language */}
                    <SettingItem title={t('settings.general.language')} layout="vertical">
                        <Select
                            value={settings.language}
                            onChange={(val) => {
                                setSetting('language', val as AppSettings['language']);
                                i18n.changeLanguage(val);
                            }}
                            options={[
                                { value: "en", label: "English" },
                                { value: "id", label: "Indonesia" },
                                { value: "ms", label: "Melayu" },
                                { value: "zh", label: "Chinese" }
                            ]}
                        />
                    </SettingItem>

                    {/* 2. Theme */}
                    <SettingItem title={t('settings.general.theme')} layout="vertical">
                        <Select
                            value={settings.theme}
                            onChange={(val) => setSetting('theme', val as AppSettings['theme'])}
                            options={[
                                { value: "system", label: t('settings.general.theme_system') },
                                { value: "light", label: t('settings.general.theme_light') },
                                { value: "dark", label: t('settings.general.theme_dark') }
                            ]}
                        />
                    </SettingItem>

                    {/* 3. Font Size */}
                    <SettingItem title={t('settings.general.font_size')} layout="vertical">
                        <Select
                            value={settings.frontendFontSize || 'medium'}
                            onChange={(val) => setSetting('frontendFontSize', val as AppSettings['frontendFontSize'])}
                            options={[
                                { value: "small", label: t('settings.general.font_small') },
                                { value: "medium", label: t('settings.general.font_medium') },
                                { value: "large", label: t('settings.general.font_large') }
                            ]}
                        />
                    </SettingItem>
                </div>
            </SettingSection>

            <SettingSection title={t('settings.general.startup')}>
                <div className="flex flex-col gap-2">
                    <SettingItem
                        title={t('settings.general.launch_startup')}
                        className="p-3 border rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                        <Switch checked={settings.launchAtStartup} onCheckedChange={handleAutostart} />
                    </SettingItem>
                    <SettingItem
                        title={t('settings.general.start_minimized')}
                        className="p-3 border rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                        <Switch checked={settings.startMinimized} onCheckedChange={val => setSetting('startMinimized', val)} />
                    </SettingItem>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                    <SettingItem title={t('settings.general.close_action')} layout="vertical">
                        <Select
                            value={settings.closeAction}
                            onChange={(val) => setSetting('closeAction', val as AppSettings['closeAction'])}
                            options={[
                                { value: 'minimize', label: t('settings.general.minimize_tray') || "Minimize to Tray" },
                                { value: 'quit', label: t('settings.general.quit_app') || "Quit Application" }
                            ]}
                        />
                    </SettingItem>
                    <p className="text-[10px] text-muted-foreground">
                        {settings.closeAction === 'minimize'
                            ? "App will keep running in background when closed."
                            : "App will completely terminate when closed."}
                    </p>
                </div>
            </SettingSection>
        </div>
    )
}
