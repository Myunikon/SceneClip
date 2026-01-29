import { Terminal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Select } from '../ui'
import { Switch } from '../ui'
import { AppSettings } from '../../store/slices/types'
import { useAppStore } from '../../store'
import { getBinaryName } from '../../lib/platform'
import { SettingItem, SettingSection } from './SettingItem'

interface SystemSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
    updateSettings: (newSettings: Partial<AppSettings>) => void
}

import { ConfirmationModal } from '../dialogs'
import { useState } from 'react'
import { notify } from '../../lib/notify'

export function SystemSettings({ settings, setSetting, updateSettings }: SystemSettingsProps) {
    const { t } = useTranslation()
    const { resetSettings } = useAppStore()
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    return (
        <div className="space-y-4">
            {/* Developer Mode - MASTER TOGGLE FIRST */}
            {/* Developer Mode - Refined UI */}
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card/50 shadow-sm transition-all hover:bg-card">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base">{t('settings.advanced.developer_mode')}</h3>
                        <p className="text-xs text-muted-foreground">{t('settings.advanced.developer_mode_desc')}</p>
                    </div>
                </div>
                <Switch
                    checked={settings.developerMode}
                    onCheckedChange={(val) => updateSettings({ developerMode: val })}
                />
            </div>

            {/* Danger Zone: Only visible if Developer Mode is on */}
            {settings.developerMode && (
                <SettingSection
                    title={t('settings.advanced.tech_paths')}
                    className="animate-in fade-in slide-in-from-top-2"
                >
                    <div className="space-y-4">
                        <SettingItem title={getBinaryName('ytdlp')} layout="vertical">
                            <input className="w-full p-2 rounded-md border border-input bg-secondary/30 font-mono text-xs shadow-sm transition-colors focus:bg-background focus:ring-1 focus:ring-ring" value={settings.binaryPathYtDlp} onChange={e => setSetting('binaryPathYtDlp', e.target.value)} placeholder={t('settings.advanced.auto_managed')} />
                        </SettingItem>
                        <SettingItem title={getBinaryName('ffmpeg')} layout="vertical">
                            <input className="w-full p-2 rounded-md border border-input bg-secondary/30 font-mono text-xs shadow-sm transition-colors focus:bg-background focus:ring-1 focus:ring-ring" value={settings.binaryPathFfmpeg} onChange={e => setSetting('binaryPathFfmpeg', e.target.value)} placeholder={t('settings.advanced.auto_managed')} />
                        </SettingItem>
                    </div>
                </SettingSection>
            )}

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
                                title={t('settings.advanced.cookie_path')}
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
                                    className="text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-md transition-colors border border-border/50 shadow-sm"
                                >
                                    {t('settings.advanced.browse_btn')}
                                </button>
                            </SettingItem>
                        </div>
                    )}
                </div>
            </SettingSection>



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

            {/* Content Enhancements */}
            <SettingSection title={t('settings.advanced.content_enhancements.title')}>
                <div className="space-y-4">


                    <SettingItem
                        title={t('settings.advanced.content_enhancements.metadata_enhancer')}
                        description={t('settings.advanced.content_enhancements.metadata_enhancer_desc')}
                    >
                        <Switch
                            checked={settings.useMetadataEnhancer}
                            onCheckedChange={(val) => setSetting('useMetadataEnhancer', val)}
                        />
                    </SettingItem>

                    <SettingItem
                        title={t('settings.advanced.content_enhancements.replaygain')}
                        description={t('settings.advanced.content_enhancements.replaygain_desc')}
                    >
                        <Switch
                            checked={settings.useReplayGain}
                            onCheckedChange={(val) => setSetting('useReplayGain', val)}
                        />
                    </SettingItem>

                    <div className="space-y-2">
                        <SettingItem
                            title={t('settings.advanced.content_enhancements.po_token')}
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
                                        {t('settings.advanced.content_enhancements.visitor_data_label')}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-secondary/50 border border-border/50 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder={t('settings.advanced.content_enhancements.visitor_data_placeholder')}
                                        value={settings.visitorData || ''}
                                        onChange={(e) => setSetting('visitorData', e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">
                                    {t('settings.advanced.content_enhancements.token_info')}
                                </p>
                            </div>
                        )}
                    </div>

                    <SettingItem
                        title={t('settings.advanced.content_enhancements.cookie_unlock')}
                        description={t('settings.advanced.content_enhancements.cookie_unlock_desc')}
                    >
                        <Switch
                            checked={settings.useChromeCookieUnlock}
                            onCheckedChange={(val) => setSetting('useChromeCookieUnlock', val)}
                        />
                    </SettingItem>
                </div>
            </SettingSection>

            {/* Data Retention Policy */}
            <SettingSection
                title={t('settings.advanced.history_retention')}
                description={t('settings.advanced.history_retention_desc')}
            >
                <div className="flex flex-col gap-4">
                    <SettingItem title={t('settings.advanced.history_retention')} layout="vertical">
                        <Select
                            value={String(settings.historyRetentionDays ?? 30)}
                            onChange={(val) => {
                                const numVal = Number(val);
                                setSetting('historyRetentionDays', numVal);
                                // Need to wait for state update or pass new value directly, but here passing numVal is enough for the days param
                                useAppStore.getState().cleanupOldTasks(numVal);
                            }}
                            options={[
                                { value: "-1", label: t('settings.advanced.retention_forever') },
                                { value: "30", label: t('settings.advanced.retention_days', { count: 30 }) },
                                { value: "14", label: t('settings.advanced.retention_days', { count: 14 }) },
                                { value: "7", label: t('settings.advanced.retention_days', { count: 7 }) },
                                { value: "3", label: t('settings.advanced.retention_days', { count: 3 }) },
                                { value: "0", label: t('settings.advanced.retention_zero') },
                            ]}
                        />
                    </SettingItem>

                    <SettingItem title={t('settings.advanced.history_max_items')} layout="vertical">
                        <Select
                            value={String(settings.maxHistoryItems ?? -1)}
                            onChange={(val) => {
                                const numVal = Number(val);
                                setSetting('maxHistoryItems', numVal);
                                useAppStore.getState().cleanupOldTasks(settings.historyRetentionDays ?? 30);
                            }}
                            options={[
                                { value: "-1", label: t('settings.advanced.retention_forever') },
                                { value: "100", label: t('settings.advanced.history_item_count', { count: 100 }) },
                                { value: "50", label: t('settings.advanced.history_item_count', { count: 50 }) },
                                { value: "20", label: t('settings.advanced.history_item_count', { count: 20 }) },
                                { value: "10", label: t('settings.advanced.history_item_count', { count: 10 }) },
                            ]}
                        />
                    </SettingItem>
                </div>
            </SettingSection>

            {/* Post-Download Action */}
            <SettingSection
                title={t('settings.advanced.post_action')}
                description={t('settings.advanced.post_download_action_desc')}
            >
                <SettingItem title={t('settings.advanced.post_action')} layout="vertical">
                    <Select
                        value={settings.postDownloadAction || 'none'}
                        onChange={(val) => setSetting('postDownloadAction', val as AppSettings['postDownloadAction'])}
                        options={[
                            { value: "none", label: t('settings.advanced.post_actions.none') },
                            { value: "sleep", label: t('settings.advanced.post_actions.sleep') },
                            { value: "shutdown", label: t('settings.advanced.post_actions.shutdown') }
                        ]}
                    />
                </SettingItem>
                {settings.postDownloadAction === 'shutdown' && (
                    <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                        ⚠️ {t('settings.advanced.shutdown_warning')}
                    </div>
                )}
            </SettingSection>

            {/* Data Management */}
            <SettingSection title={t('settings.advanced.data_management')}>
                <div className="flex flex-col gap-1">
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
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-secondary/50 transition-colors group text-left"
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
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-secondary/50 transition-colors group text-left"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_import_history')}</span>
                    </button>

                    <button
                        onClick={() => setSetting('hasSeenOnboarding', false)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors group text-left"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_replay_welcome')}</span>
                    </button>

                    <div className="h-px bg-border/40 my-1" />

                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-500 transition-colors group text-left"
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
                            setTimeout(() => window.location.reload(), 1000)
                        }}
                        title={t('settings.advanced.alerts.confirm_reset')}
                        description={t('settings.advanced.alerts.reset_confirm_desc')}
                        confirmLabel={t('settings.advanced.alerts.reset_confirm_btn')}
                        variant="danger"
                    />
                </div>
            </SettingSection>
        </div>
    )
}
