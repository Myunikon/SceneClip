import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '../ui'
import { Switch } from '../ui'
import { AppSettings } from '../../store/slices/types'
import { enable, disable } from '@tauri-apps/plugin-autostart'
import { SettingItem, SettingSection } from './SettingItem'
import { notify } from '../../lib/notify'
import { Monitor, Power, Loader2 } from 'lucide-react'
import { SUPPORTED_LANGUAGES, THEMES, FONT_SIZES, CLOSE_ACTIONS, POST_DOWNLOAD_ACTIONS } from './constants'

interface GeneralSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

export function GeneralSettings({ settings, setSetting }: GeneralSettingsProps) {
    const { t, i18n } = useTranslation()
    const [isTogglingAutostart, setIsTogglingAutostart] = useState(false)

    // Fix: Race Condition & Error Handling
    // Added loading state to prevent rapid toggling
    const handleAutostart = async (enabled: boolean) => {
        if (isTogglingAutostart) return

        setIsTogglingAutostart(true)
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
            // Revert the switch via UI state implication (since we didn't update store if failed)
        } finally {
            setIsTogglingAutostart(false)
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
                                options={SUPPORTED_LANGUAGES.map(lang => ({
                                    ...lang,
                                    label: lang.label // In a real app we might translate label here too
                                }))}
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
                                options={THEMES.map(th => ({
                                    value: th.value,
                                    label: t(th.label)
                                }))}
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
                                options={FONT_SIZES.map(fs => ({
                                    value: fs.value,
                                    label: t(fs.label)
                                }))}
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
                        <div className="flex items-center gap-2">
                            {isTogglingAutostart && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                            <Switch
                                checked={settings.launchAtStartup}
                                onCheckedChange={handleAutostart}
                                disabled={isTogglingAutostart}
                            />
                        </div>
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
                        title={t('settings.general.auto_detect_clipboard') || "Auto Detect Links"}
                        description={t('settings.general.auto_detect_clipboard_desc') || "Automatically prompt to download when copying video links"}
                        className="hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <Switch
                            checked={settings.enableAutoClipboard}
                            onCheckedChange={val => setSetting('enableAutoClipboard', val)}
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
                                options={CLOSE_ACTIONS.map(a => ({
                                    value: a.value,
                                    label: t(a.label)
                                }))}
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
                                options={POST_DOWNLOAD_ACTIONS.map(a => ({
                                    value: a.value,
                                    label: t(a.label)
                                }))}
                            />
                        </div>
                    </SettingItem>
                </div>
            </SettingSection>

        </div>
    )
}
