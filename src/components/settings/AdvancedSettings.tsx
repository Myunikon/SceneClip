import { Terminal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Select } from '../Select'
import { Switch } from '../Switch'
import { AppSettings } from '../../store/slices/types'
import { useAppStore } from '../../store'
import { getBinaryName } from '../../lib/platform'
import { SettingItem, SettingSection } from './SettingItem'

interface AdvancedSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
    updateSettings: (newSettings: Partial<AppSettings>) => void
}

import { ConfirmationModal } from '../ConfirmationModal'
import { useState } from 'react'
import { notify } from '../../lib/notify'

export function AdvancedSettings({ settings, setSetting, updateSettings }: AdvancedSettingsProps) {
    const { t } = useTranslation()
    const { resetSettings } = useAppStore()
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    return (
        <div className="space-y-4">
            {/* Developer Mode - MASTER TOGGLE FIRST */}
            <SettingSection
                title={t('settings.advanced.developer_mode')}
                description={t('settings.advanced.developer_mode_desc') || "Enable technical tools and logs"}
                className="bg-orange-500/5 border-orange-500/20"
                icon={<Terminal className="w-5 h-5" />}
            >
                <div className="flex justify-end">
                    <Switch
                        checked={settings.developerMode}
                        onCheckedChange={(val) => updateSettings({ developerMode: val })}
                    />
                </div>
            </SettingSection>

            {/* Authentication & Cookies */}
            <SettingSection title={t('settings.advanced.auth')}>
                <div className="space-y-4">
                    <SettingItem title={t('settings.advanced.source')} layout="vertical">
                        <Select
                            value={settings.cookieSource}
                            onChange={val => setSetting('cookieSource', val as AppSettings['cookieSource'])}
                            options={[
                                { value: "none", label: t('settings.advanced.source_disabled') },
                                { value: "browser", label: t('settings.advanced.use_browser') },
                                { value: "txt", label: t('settings.advanced.use_txt') }
                            ]}
                        />
                    </SettingItem>

                    {settings.cookieSource === 'browser' && (
                        <div className="animate-in fade-in slide-in-from-top-1">
                            <SettingItem title={t('settings.advanced.browser_type')} layout="vertical">
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
                                title={t('settings.advanced.cookie_path') || "Cookie File Path"}
                                layout="vertical"
                                description={
                                    <div className="relative mt-2">
                                        <input
                                            className="w-full p-2 pr-8 rounded-md border bg-background/50 font-mono text-xs truncate"
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
                                                filters: [{ name: 'Text File', extensions: ['txt'] }],
                                                multiple: false
                                            })
                                            if (selected && typeof selected === 'string') {
                                                setSetting('cookiePath', selected)
                                            }
                                        } catch (e) {
                                            console.error("Failed to open file dialog", e)
                                        }
                                    }}
                                    className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-colors"
                                >
                                    Browse...
                                </button>
                            </SettingItem>
                        </div>
                    )}
                </div>
            </SettingSection>

            {/* Danger Zone: Only visible if Developer Mode is on */}
            {settings.developerMode && (
                <SettingSection
                    title={t('settings.advanced.tech_paths')}
                    className="bg-red-500/5 border-red-500/20 animate-in fade-in slide-in-from-top-2"
                >
                    <div className="space-y-4">
                        <SettingItem title={getBinaryName('ytdlp')} layout="vertical">
                            <input className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.binaryPathYtDlp} onChange={e => setSetting('binaryPathYtDlp', e.target.value)} placeholder="Auto-managed" />
                        </SettingItem>
                        <SettingItem title={getBinaryName('ffmpeg')} layout="vertical">
                            <input className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.binaryPathFfmpeg} onChange={e => setSetting('binaryPathFfmpeg', e.target.value)} placeholder="Auto-managed" />
                        </SettingItem>
                    </div>
                </SettingSection>
            )}

            {/* Video Processing - Hardware Acceleration */}
            <SettingSection title={t('settings.advanced.video_processing.title')}>
                <div className="space-y-4">
                    <SettingItem
                        title={t('settings.advanced.video_processing.hw_accel')}
                        description={t('settings.advanced.video_processing.hw_desc')}
                    >
                        <Switch
                            checked={settings.hardwareDecoding}
                            onCheckedChange={(val) => setSetting('hardwareDecoding', val)}
                        />
                    </SettingItem>

                    {/* GPU Badge Status */}
                    <div className="flex items-center gap-2 text-xs bg-secondary/50 p-2 rounded-lg border border-border/50">
                        <span className="font-bold text-muted-foreground">{t('settings.advanced.detected_gpu')}</span>
                        <span className="font-mono text-primary">
                            {useAppStore.getState().gpuModel || t('settings.advanced.unknown_integrated')}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase text-[10px] font-bold">
                            {useAppStore.getState().gpuType}
                        </span>
                    </div>
                </div>
            </SettingSection>

            {/* Data Management */}
            <SettingSection title={t('settings.advanced.data_management')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={async () => {
                            try {
                                const { save } = await import('@tauri-apps/plugin-dialog')
                                const { writeTextFile } = await import('@tauri-apps/plugin-fs')
                                const { tasks } = useAppStore.getState()
                                const path = await save({ filters: [{ name: 'JSON', extensions: ['json'] }], defaultPath: 'sceneclip_backup.json' })
                                if (path) {
                                    await writeTextFile(path, JSON.stringify({ version: 1, tasks }, null, 2))
                                    notify.success(t('settings.advanced.alerts.export_success'))
                                }
                            } catch (e) { notify.error(t('settings.advanced.alerts.export_fail') + e) }
                        }}
                        className="p-3 text-sm border rounded-xl hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_export_history')}</span>
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                const { open } = await import('@tauri-apps/plugin-dialog')
                                const { readTextFile } = await import('@tauri-apps/plugin-fs')
                                const path = await open({ filters: [{ name: 'JSON', extensions: ['json'] }] })
                                if (path && typeof path === 'string') {
                                    const data = JSON.parse(await readTextFile(path))
                                    if (data?.tasks) {
                                        useAppStore.getState().importTasks(data.tasks)
                                        notify.success(t('settings.advanced.alerts.import_success').replace('{n}', String(data.tasks.length)))
                                    }
                                }
                            } catch (e) { notify.error(t('settings.advanced.alerts.import_fail') + e) }
                        }}
                        className="p-3 text-sm border rounded-xl hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_import_history')}</span>
                    </button>

                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="p-3 text-sm border rounded-xl hover:bg-red-500/10 hover:border-red-500/30 transition-colors flex items-center justify-between group text-red-500"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_reset_data')}</span>
                    </button>
                    <ConfirmationModal
                        isOpen={showResetConfirm}
                        onClose={() => setShowResetConfirm(false)}
                        onConfirm={() => {
                            resetSettings()
                            notify.success(t('settings.advanced.alerts.reset_success_title'), {
                                description: t('settings.advanced.alerts.reset_success_desc'),
                                duration: 3000
                            })
                            // Optional: Reload to force clean state
                            setTimeout(() => window.location.reload(), 1000)
                        }}
                        title={t('settings.advanced.alerts.confirm_reset') || "Reset Everything?"}
                        description={t('settings.advanced.alerts.reset_confirm_desc')}
                        confirmLabel={t('settings.advanced.alerts.reset_confirm_btn')}
                        variant="danger"
                    />

                    <button
                        onClick={() => setSetting('hasSeenOnboarding', false)}
                        className="p-3 text-sm border rounded-xl hover:bg-emerald-500/10 transition-colors flex items-center justify-between group"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_replay_welcome')}</span>
                    </button>
                </div>
            </SettingSection>
        </div>
    )
}
