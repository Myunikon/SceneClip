import { useTranslation } from 'react-i18next'
import { Select } from '../ui'
import { Switch } from '../ui'
import { AppSettings } from '../../store/slices/types'
import { enable, disable } from '@tauri-apps/plugin-autostart'
import { SettingItem, SettingSection } from './SettingItem'
import { notify } from '../../lib/notify'
import { Monitor, Power } from 'lucide-react'

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
            notify.error(t('settings.general.autostart_fail') || "Failed to toggle autostart", { description: String(e) })
        }
    }

    return (
        <div className="space-y-6">
            {/* Appearance Section */}
            <SettingSection
                title={t('settings.general.language_theme')}
                icon={<Monitor className="w-4 h-4" />}
            >
                <div className="space-y-1">
                    {/* 1. Language */}
                    <SettingItem
                        title={t('settings.general.language')}
                        layout="horizontal"
                        className="p-2 hover:bg-secondary/30 rounded-lg transition-colors"
                    >
                        <div className="w-48">
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
                        </div>
                    </SettingItem>

                    <div className="h-px bg-border/30 mx-2" />

                    {/* 2. Theme */}
                    <SettingItem
                        title={t('settings.general.theme')}
                        layout="horizontal"
                        className="p-2 hover:bg-secondary/30 rounded-lg transition-colors"
                    >
                        <div className="w-48">
                            <Select
                                value={settings.theme}
                                onChange={(val) => setSetting('theme', val as AppSettings['theme'])}
                                options={[
                                    { value: "system", label: t('settings.general.theme_system') },
                                    { value: "light", label: t('settings.general.theme_light') },
                                    { value: "dark", label: t('settings.general.theme_dark') }
                                ]}
                            />
                        </div>
                    </SettingItem>

                    <div className="h-px bg-border/30 mx-2" />

                    {/* 3. Font Size */}
                    <SettingItem
                        title={t('settings.general.font_size')}
                        layout="horizontal"
                        className="p-2 hover:bg-secondary/30 rounded-lg transition-colors"
                    >
                        <div className="w-48">
                            <Select
                                value={settings.frontendFontSize || 'medium'}
                                onChange={(val) => setSetting('frontendFontSize', val as AppSettings['frontendFontSize'])}
                                options={[
                                    { value: "small", label: t('settings.general.font_small') },
                                    { value: "medium", label: t('settings.general.font_medium') },
                                    { value: "large", label: t('settings.general.font_large') }
                                ]}
                            />
                        </div>
                    </SettingItem>
                </div>
            </SettingSection>

            {/* System & Behavior Section */}
            <SettingSection
                title={t('settings.general.system_behavior') || "Window & System"}
                icon={<Power className="w-4 h-4" />}
            >
                <div className="space-y-1">
                    <SettingItem
                        title={t('settings.general.launch_startup')}
                        description={t('settings.general.launch_startup_desc')}
                        className="hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <Switch checked={settings.launchAtStartup} onCheckedChange={handleAutostart} />
                    </SettingItem>

                    <SettingItem
                        title={t('settings.general.start_minimized')}
                        description={t('settings.general.start_minimized_desc')}
                        className="hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <Switch checked={settings.startMinimized} onCheckedChange={val => setSetting('startMinimized', val)} />
                    </SettingItem>





                    <SettingItem
                        title={t('settings.general.desktop_notifications') || "Desktop Notifications"}
                        description={t('settings.general.desktop_notifications_desc') || "Show notifications when in background"}
                        className="hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <Switch
                            checked={settings.enableDesktopNotifications}
                            onCheckedChange={val => setSetting('enableDesktopNotifications', val)}
                        />
                    </SettingItem>

                    <SettingItem
                        title={t('settings.general.prevent_suspend') || "Prevent Sleep"}
                        description={t('settings.general.prevent_suspend_desc') || "Keep system awake during downloads"}
                        className="hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <Switch
                            checked={settings.preventSuspendDuringDownload}
                            onCheckedChange={val => setSetting('preventSuspendDuringDownload', val)}
                        />
                    </SettingItem>

                    <SettingItem
                        title={t('settings.general.close_action')}
                        layout="horizontal"
                        description={settings.closeAction === 'minimize'
                            ? (t('settings.general.minimize_desc') || "App keeps running in background")
                            : (t('settings.general.quit_desc') || "App terminates completely")}
                        className="p-2 hover:bg-secondary/30 rounded-lg transition-colors"
                    >
                        <div className="w-48">
                            <Select
                                value={settings.closeAction}
                                onChange={(val) => setSetting('closeAction', val as AppSettings['closeAction'])}
                                options={[
                                    { value: 'minimize', label: t('settings.general.minimize_tray') || "Minimize to Tray" },
                                    { value: 'quit', label: t('settings.general.quit_app') || "Quit Application" }
                                ]}
                            />
                        </div>
                    </SettingItem>

                    {/* Post-Download Action (Moved from Downloads) */}
                    <SettingItem
                        title={t('settings.advanced.post_action') || "Post-Download Action"}
                        layout="horizontal"
                        description={settings.postDownloadAction === 'shutdown'
                            ? (t('settings.advanced.shutdown_warning') || "Warning: Forces shutdown!")
                            : (t('settings.advanced.post_download_action_desc') || "Action after all downloads finish")}
                        className={settings.postDownloadAction === 'shutdown' ? 'bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors' : 'hover:bg-secondary/30 rounded-lg transition-colors'}
                    >
                        <div className="w-48">
                            <Select
                                value={settings.postDownloadAction || 'none'}
                                onChange={(val) => setSetting('postDownloadAction', val as AppSettings['postDownloadAction'])}
                                options={[
                                    { value: "none", label: t('settings.advanced.post_actions.none') || "Do Nothing" },
                                    { value: "sleep", label: t('settings.advanced.post_actions.sleep') || "Sleep System" },
                                    { value: "shutdown", label: t('settings.advanced.post_actions.shutdown') || "Shutdown System" }
                                ]}
                            />
                        </div>
                    </SettingItem>
                </div>
            </SettingSection>

        </div>
    )
}
