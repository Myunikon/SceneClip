import { Terminal, History, Database, Monitor, Music, FolderOpen, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Select, Switch, Button } from '../ui'
import { AppSettings } from '../../store/slices/types'
import { useAppStore } from '../../store'
import { SettingItem, SettingSection } from './SettingItem'
import { ConfirmationModal } from '../dialogs'
import { useState, useEffect } from 'react'
import { notify } from '../../lib/notify'
import { validateBinary, detectBinaryType } from '../../lib/binaryValidator'
import { cn } from '../../lib/utils'

// @ts-ignore - Reserved for future type-specific logic
const _detect = detectBinaryType;

interface SystemSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
    updateSettings: (newSettings: Partial<AppSettings>) => void
}

function BinaryPathInput({ label, value, onChange, description, expectedType }: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    description?: string,
    expectedType: 'ytdlp' | 'ffmpeg' | 'ffprobe' | 'node' | 'deno' | 'bun' | 'js-runtime'
}) {
    const { t } = useTranslation()
    const [status, setStatus] = useState<{ isValid: boolean | null, version: string | null, loading: boolean }>({
        isValid: null,
        version: null,
        loading: false
    })

    const validate = async (path: string) => {
        if (!path || path.trim() === '' || path.includes('Auto-managed')) {
            setStatus({ isValid: null, version: null, loading: false })
            return
        }

        // Prevent concurrent validation
        if (status.loading) return;

        setStatus(s => ({ ...s, loading: true }))
        try {
            const detected = detectBinaryType(path)

            // Strict type check
            const isJsRuntimeField = expectedType === 'js-runtime'
            const isJsBinary = detected === 'node' || detected === 'deno' || detected === 'bun'

            if (detected) {
                const isMismatch = isJsRuntimeField ? !isJsBinary : detected !== expectedType

                if (isMismatch) {
                    setStatus({ isValid: false, version: null, loading: false })
                    notify.error(t('settings.advanced.validation.invalid') || "Binary Invalid", {
                        description: `File appears to be ${detected.toUpperCase()}, but ${expectedType.toUpperCase()} is expected.`
                    })
                    return
                }
            }
            // If NOT detected (null), we proceed to backend validation.
            // This allows renamed binaries (e.g., yt-dlp.exe to my-dlp.exe) to work!

            const valType = isJsRuntimeField ? (detected || 'deno') as any : expectedType
            const res = await validateBinary(path, valType)
            setStatus({ isValid: res.isValid, version: res.version || null, loading: false })

            if (res.isValid) {
                notify.success(t('settings.advanced.validation.valid') || "Binary Valid", {
                    description: t('settings.advanced.validation.success_desc', { version: res.version })
                })
            } else {
                notify.error(t('settings.advanced.validation.invalid') || "Binary Invalid", {
                    description: t('settings.advanced.validation.error_desc') || "Verification failed."
                })
            }
        } catch (e) {
            setStatus({ isValid: false, version: null, loading: false })
            notify.error(t('settings.advanced.validation.invalid') || "Binary Invalid", {
                description: "Critical verification error"
            })
        }
    }

    // Validate on mount or reset
    useEffect(() => {
        if (value && value.trim() !== '' && !value.includes('Auto-managed') && status.isValid === null) {
            validate(value)
        } else if (!value || value.trim() === '' || value.includes('Auto-managed')) {
            setStatus({ isValid: null, version: null, loading: false })
        }
    }, []) // Only on mount

    const handleBrowse = async () => {
        try {
            const { open } = await import('@tauri-apps/plugin-dialog')
            const path = await open({
                multiple: false,
                directory: false,
                filters: [
                    { name: 'Executable', extensions: ['exe', 'bin', 'sh', 'bat', 'cmd', '*'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            })

            if (path && typeof path === 'string') {
                onChange(path)
                validate(path) // Trigger explicitly
            }
        } catch (e) {
            notify.error("Failed to open file browser")
        }
    }

    return (
        <SettingItem title={label} layout="vertical" description={description}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        className={cn(
                            "w-full p-2.5 rounded-xl border font-mono text-xs shadow-sm transition-all outline-none",
                            "bg-secondary/30 focus:bg-background",
                            status.isValid === true && "ring-2 ring-emerald-500/50 border-emerald-500/50 bg-emerald-500/5",
                            status.isValid === false && "ring-2 ring-red-500/50 border-red-500/50 bg-red-500/5",
                            status.isValid === null && "border-input focus:ring-2 focus:ring-primary/20",
                            status.loading && "opacity-70"
                        )}
                        value={value}
                        onChange={e => {
                            onChange(e.target.value)
                            if (status.isValid !== null) setStatus({ isValid: null, version: null, loading: false })
                        }}
                        onBlur={() => validate(value)}
                        placeholder={t('settings.advanced.auto_managed')}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {value && !value.includes('Auto-managed') && (
                            <button
                                onClick={() => {
                                    onChange('')
                                    setStatus({ isValid: null, version: null, loading: false })
                                }}
                                className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                title={t('settings.advanced.clear_path')}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                        {status.loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-[38px] w-[38px] rounded-xl border-dashed hover:border-solid transition-all"
                    onClick={handleBrowse}
                >
                    <FolderOpen className="w-4 h-4" />
                </Button>
            </div>
        </SettingItem>
    )
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
                        <BinaryPathInput
                            label="YT-DLP"
                            value={settings.binaryPathYtDlp}
                            onChange={val => setSetting('binaryPathYtDlp', val)}
                            expectedType="ytdlp"
                        />
                        <BinaryPathInput
                            label="FFMPEG"
                            value={settings.binaryPathFfmpeg}
                            onChange={val => setSetting('binaryPathFfmpeg', val)}
                            expectedType="ffmpeg"
                        />
                        <BinaryPathInput
                            label="FFPROBE"
                            value={settings.binaryPathFfprobe}
                            onChange={val => setSetting('binaryPathFfprobe', val)}
                            expectedType="ffprobe"
                        />
                        <BinaryPathInput
                            label={t('settings.advanced.js_runtime') || "JS Runtime (Node/Deno)"}
                            description={t('settings.advanced.js_runtime_desc')}
                            value={settings.binaryPathNode}
                            onChange={val => setSetting('binaryPathNode', val)}
                            expectedType="js-runtime"
                        />
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
                                        notify.success(t('settings.advanced.alerts.import_success', { n: data.tasks.length }))
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
