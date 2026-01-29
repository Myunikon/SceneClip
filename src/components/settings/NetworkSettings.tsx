import { useTranslation } from 'react-i18next'
import { Switch, Select, Slider } from '../ui'
import { AppSettings } from '../../store/slices/types'
import { SettingItem, SettingSection } from './SettingItem'
import { Key, Trash2 } from 'lucide-react'

interface NetworkSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

export function NetworkSettings({ settings, setSetting }: NetworkSettingsProps) {
    const { t } = useTranslation()
    return (
        <div className="space-y-4">
            {/* Traffic Control (User Request: Top) */}
            <SettingSection title={t('settings.network.connection') || "Speed & Connection"}>
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
                </div>
            </SettingSection>

            <SettingSection title={t('settings.network.proxy') || "Network Access"}>
                <div className="space-y-4">
                    {/* Proxy */}
                    <SettingItem title={t('settings.network.proxy') || "Proxy Server"} layout="vertical">
                        <input
                            className="w-full p-2.5 rounded-lg border border-input bg-background/80 font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                            value={settings.proxy}
                            onChange={(e) => setSetting('proxy', e.target.value)}
                            placeholder="http://127.0.0.1:8080"
                        />
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

                    {/* Smart Proxy Rotator */}
                    <SettingItem
                        title={t('settings.advanced.content_enhancements.smart_proxy') || "Smart Proxy"}
                        description={t('settings.advanced.content_enhancements.smart_proxy_desc')}
                    >
                        <Switch
                            checked={settings.useSmartProxy}
                            onCheckedChange={(val) => setSetting('useSmartProxy', val)}
                        />
                    </SettingItem>

                    {/* PO Token Security */}
                    <SettingItem
                        title={t('settings.advanced.content_enhancements.po_token') || "PO Token"}
                        description={t('settings.advanced.content_enhancements.po_token_desc')}
                    >
                        <Switch
                            checked={settings.usePoToken}
                            onCheckedChange={(val) => setSetting('usePoToken', val)}
                        />
                    </SettingItem>

                    {settings.usePoToken && (
                        <div className="pl-6 space-y-3 pt-2 border-l-2 border-primary/20 ml-2 animate-in slide-in-from-left-2 duration-300">
                            <div className="grid gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('settings.advanced.content_enhancements.po_token_label')}
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-secondary/50 border border-border/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder={t('settings.advanced.content_enhancements.po_token_placeholder')}
                                    value={settings.poToken || ''}
                                    onChange={(e) => setSetting('poToken', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {t('settings.advanced.visitor_data_label') || "Visitor Data"}
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-secondary/50 border border-border/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder={t('settings.advanced.content_enhancements.visitor_data_placeholder')}
                                    value={settings.visitorData || ''}
                                    onChange={(e) => setSetting('visitorData', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </SettingSection>



            {/* Authentication & Cookies (Moved from System) */}
            <SettingSection
                title={t('settings.advanced.auth') || "Authentication"}
                icon={<Key className="w-4 h-4" />}
            >
                <div className="space-y-4">
                    <SettingItem title={t('settings.advanced.source') || "Cookie Source"} layout="vertical">
                        <Select
                            value={settings.cookieSource}
                            onChange={val => setSetting('cookieSource', val as AppSettings['cookieSource'])}
                            options={[
                                { value: "none", label: t('settings.advanced.source_disabled') || "Disabled" },
                                { value: "browser", label: t('settings.advanced.use_browser') || "From Browser" },
                                { value: "txt", label: t('settings.advanced.use_txt') || "From .txt File" }
                            ]}
                        />
                    </SettingItem>

                    <SettingItem
                        title={t('settings.advanced.content_enhancements.cookie_unlock') || "Cookie Unlock"}
                        description={t('settings.advanced.content_enhancements.cookie_unlock_desc')}
                    >
                        <Switch
                            checked={settings.useChromeCookieUnlock}
                            onCheckedChange={(val) => setSetting('useChromeCookieUnlock', val)}
                        />
                    </SettingItem>

                    {settings.cookieSource === 'browser' && (
                        <div className="animate-in fade-in slide-in-from-top-1">
                            <SettingItem title={t('settings.advanced.browser_type') || "Browser"} layout="vertical">
                                <Select
                                    value={settings.browserType || 'chrome'}
                                    onChange={val => setSetting('browserType', val as AppSettings['browserType'])}
                                    options={[
                                        { value: "chrome", label: "Google Chrome" },
                                        { value: "edge", label: "Microsoft Edge" },
                                        { value: "firefox", label: "Mozilla Firefox" },
                                        { value: "opera", label: "Opera" },
                                        { value: "brave", label: "Brave" },
                                        { value: "vivaldi", label: "Vivaldi" }
                                    ]}
                                />
                            </SettingItem>
                        </div>
                    )}

                    {settings.cookieSource === 'txt' && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <SettingItem
                                title={t('settings.advanced.cookie_path') || "Cookie File"}
                                layout="vertical"
                                description={
                                    <div className="relative mt-2">
                                        <input
                                            className="w-full p-2 pr-8 rounded-md border border-input bg-secondary/30 font-mono text-xs truncate shadow-sm transition-colors focus:bg-background focus:ring-1 focus:ring-ring"
                                            value={settings.cookiePath || ''}
                                            readOnly
                                            placeholder={t('settings.advanced.no_file')}
                                        />
                                        {settings.cookiePath && (
                                            <button
                                                onClick={() => setSetting('cookiePath', '')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 transition-colors"
                                                title={t('settings.advanced.clear_path')}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                }
                            >
                                <button
                                    onClick={async () => {
                                        try {
                                            const { open } = await import('@tauri-apps/plugin-dialog')
                                            const selected = await open({
                                                filters: [{ name: t('settings.advanced.text_file') || 'Text File', extensions: ['txt'] }],
                                                multiple: false
                                            })
                                            if (selected && typeof selected === 'string') {
                                                setSetting('cookiePath', selected)
                                            }
                                        } catch (e) {
                                            console.error("Failed to open file dialog", e)
                                        }
                                    }}
                                    className="text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-md transition-colors border border-border/50 shadow-sm"
                                >
                                    {t('settings.advanced.browse_btn') || "Browse..."}
                                </button>
                            </SettingItem>
                        </div>
                    )}
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
            </SettingSection >
        </div >
    )
}
