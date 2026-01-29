import { Terminal, History, Database, Monitor, Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Select, Switch } from '../ui'
import { AppSettings } from '../../store/slices/types'
import { useAppStore } from '../../store'
import { getBinaryName } from '../../lib/platform'
import { SettingItem, SettingSection } from './SettingItem'
import { ConfirmationModal } from '../dialogs'
import { useState } from 'react'
import { notify } from '../../lib/notify'

interface SystemSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
    updateSettings: (newSettings: Partial<AppSettings>) => void
}

export function SystemSettings({ settings, setSetting, updateSettings }: SystemSettingsProps) {
    const { t } = useTranslation()
    const { resetSettings } = useAppStore()
    const [showResetConfirm, setShowResetConfirm] = useState(false)

    return (
        <div className="space-y-4">
            {/* Developer Mode - MASTER TOGGLE */}
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card/50 shadow-sm transition-all hover:bg-card">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base">{t('settings.advanced.developer_mode') || "Developer Mode"}</h3>
                        <p className="text-xs text-muted-foreground">{t('settings.advanced.developer_mode_desc')}</p>
                    </div>
                </div>
                <Switch
                    checked={settings.developerMode}
                    onCheckedChange={(val) => updateSettings({ developerMode: val })}
                />
            </div>

            {/* Binary Paths: Only visible if Developer Mode is on */}
            {settings.developerMode && (
                <SettingSection
                    title={t('settings.advanced.tech_paths') || "Binary Paths"}
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



            {/* Performance Section */}
            <SettingSection
                title={t('settings.advanced.video_processing.title') || "Video Processing"}
                icon={<Monitor className="w-4 h-4" />}
            >
                <SettingItem
                    title={t('settings.advanced.video_processing.hw_accel') || "Hardware Acceleration"}
                    description={t('settings.advanced.video_processing.hw_desc')}
                >
                    <Switch
                        checked={settings.hardwareDecoding}
                        onCheckedChange={(val) => setSetting('hardwareDecoding', val)}
                    />
                </SettingItem>

                {/* GPU Badge Status */}
                <div className="mt-4 flex items-center gap-2 text-xs bg-secondary/50 p-2 rounded-lg border border-border/50">
                    <span className="font-bold text-muted-foreground">{t('settings.advanced.detected_gpu') || "GPU:"}</span>
                    <span className="font-mono text-primary">
                        {useAppStore.getState().gpuModel || t('settings.advanced.unknown_integrated') || "Integrated"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase text-[10px] font-bold">
                        {useAppStore.getState().gpuType}
                    </span>
                </div>
            </SettingSection>

            {/* Audio Processing Section */}
            <SettingSection title={t('settings.quality.audio') || "Audio Processing"} icon={<Music className="w-4 h-4" />}>
                <div className="space-y-4">
                    <SettingItem
                        title={t('settings.quality.audio_normalization') || "Loudness Normalization"}
                        description={t('settings.quality.audio_normalization_desc')}
                    >
                        <Switch
                            checked={settings.audioNormalization}
                            onCheckedChange={(val) => setSetting('audioNormalization', val)}
                        />
                    </SettingItem>

                    <SettingItem
                        title={t('settings.advanced.content_enhancements.replaygain') || "ReplayGain"}
                        description={t('settings.advanced.content_enhancements.replaygain_desc')}
                    >
                        <Switch
                            checked={settings.useReplayGain}
                            onCheckedChange={(val) => setSetting('useReplayGain', val)}
                        />
                    </SettingItem>
                </div>
            </SettingSection>

            {/* History Management */}
            <SettingSection
                title={t('settings.advanced.history_retention') || "History & Privacy"}
                description={t('settings.advanced.history_retention_desc')}
                icon={<History className="w-4 h-4" />}
            >
                <div className="space-y-4">
                    <SettingItem title={t('settings.advanced.history_retention')} layout="vertical">
                        <Select
                            value={String(settings.historyRetentionDays ?? 30)}
                            onChange={(val) => {
                                const numVal = Number(val);
                                setSetting('historyRetentionDays', numVal);
                                useAppStore.getState().cleanupOldTasks(numVal);
                            }}
                            options={[
                                { value: "-1", label: t('settings.advanced.retention_forever') || "Keep Forever" },
                                { value: "30", label: t('settings.advanced.retention_days', { count: 30 }) },
                                { value: "14", label: t('settings.advanced.retention_days', { count: 14 }) },
                                { value: "7", label: t('settings.advanced.retention_days', { count: 7 }) },
                                { value: "3", label: t('settings.advanced.retention_days', { count: 3 }) },
                                { value: "0", label: t('settings.advanced.retention_zero') || "Clear on Close" },
                            ]}
                        />
                    </SettingItem>

                    <SettingItem title={t('settings.advanced.history_max_items') || "Max Items"} layout="vertical">
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

            {/* Data Management */}
            <SettingSection
                title={t('settings.advanced.data_management') || "Data Management"}
                icon={<Database className="w-4 h-4" />}
            >
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
                                    notify.success(t('settings.advanced.alerts.export_success') || "History exported successfully")
                                }
                            } catch (e) { notify.error((t('settings.advanced.alerts.export_fail') || "Export failed: ") + e) }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-secondary/50 transition-colors group text-left"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_export_history') || "Export History (.json)"}</span>
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
                                        notify.success((t('settings.advanced.alerts.import_success') || "Successfully imported {n} tasks").replace('{n}', String(data.tasks.length)))
                                    }
                                }
                            } catch (e) { notify.error((t('settings.advanced.alerts.import_fail') || "Import failed: ") + e) }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-secondary/50 transition-colors group text-left"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_import_history') || "Import History (.json)"}</span>
                    </button>

                    <button
                        onClick={() => {
                            setSetting('hasSeenOnboarding', false)
                            notify.success(t('settings.general.replay_welcome_desc') || "Onboarding tutorial will be shown on next launch.")
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-secondary/50 transition-colors group text-left"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_replay_welcome') || "Replay Welcome"}</span>
                    </button>

                    <div className="h-px bg-border/40 my-1" />

                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-500 transition-colors group text-left"
                    >
                        <span className="font-medium">{t('settings.advanced.btn_reset_data') || "Reset All Data & Settings"}</span>
                    </button>

                    <ConfirmationModal
                        isOpen={showResetConfirm}
                        onClose={() => setShowResetConfirm(false)}
                        onConfirm={() => {
                            resetSettings()
                            notify.success(t('settings.advanced.alerts.reset_success_title') || "Data Reset", {
                                description: t('settings.advanced.alerts.reset_success_desc') || "Your settings have been restored to defaults.",
                                duration: 3000
                            })
                            setTimeout(() => window.location.reload(), 1000)
                        }}
                        title={t('settings.advanced.alerts.confirm_reset') || "Confirm Reset"}
                        description={t('settings.advanced.alerts.reset_confirm_desc') || "Are you sure? This will wipe all your history and settings."}
                        confirmLabel={t('settings.advanced.alerts.reset_confirm_btn') || "Reset Everything"}
                        variant="danger"
                    />
                </div>
            </SettingSection>
        </div>
    )
}
