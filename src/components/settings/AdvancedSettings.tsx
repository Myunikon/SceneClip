import { Terminal, Trash2 } from 'lucide-react'

import { Select } from '../Select'
import { Switch } from '../Switch'
import { AppSettings } from '../../store/slices/types'
import { useAppStore } from '../../store'
import { getBinaryName } from '../../lib/platform'

interface AdvancedSettingsProps {
    settings: AppSettings
    setSetting: (key: string, val: any) => void
    updateSettings: (newSettings: Partial<AppSettings>) => void
    t: any
}

export function AdvancedSettings({ settings, setSetting, updateSettings, t }: AdvancedSettingsProps) {
    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {/* Developer Mode - MASTER TOGGLE FIRST */}
            <section className="p-5 border rounded-xl bg-orange-500/5 border-orange-500/20 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-base">Developer Mode</div>
                            <div className="text-xs text-muted-foreground">{t.settings.advanced.developer_mode_desc || "Enable technical tools and logs"}</div>
                        </div>
                    </div>
                    <Switch
                        checked={settings.developerMode}
                        onCheckedChange={(val) => updateSettings({ developerMode: val })}
                    />
                </div>
            </section>

            {/* Authentication & Cookies */}
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    {t.settings.advanced.auth}
                </h3>
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">{t.settings.advanced.source}</label>
                    <Select
                        value={settings.cookieSource}
                        onChange={val => setSetting('cookieSource', val)}
                        options={[
                            { value: "none", label: "Disabled (Default)" },
                            { value: "browser", label: t.settings.advanced.use_browser },
                            { value: "txt", label: t.settings.advanced.use_txt }
                        ]}
                    />

                    {settings.cookieSource === 'browser' && (
                        <div className="pt-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">Browser Type</label>
                            <Select
                                value={settings.browserType || 'chrome'}
                                onChange={val => setSetting('browserType', val)}
                                options={[
                                    { value: "chrome", label: "Google Chrome" },
                                    { value: "edge", label: "Microsoft Edge" },
                                    { value: "firefox", label: "Mozilla Firefox" },
                                    { value: "opera", label: "Opera" },
                                    { value: "brave", label: "Brave" },
                                    { value: "vivaldi", label: "Vivaldi" }
                                ]}
                            />
                        </div>
                    )}

                    {settings.cookieSource === 'txt' && (
                        <div className="pt-2 animate-in fade-in zoom-in-95 duration-200">
                            <label className="text-xs font-semibold uppercase text-muted-foreground flex justify-between items-center mb-2">
                                <span>{t.settings.advanced.cookie_path || "Cookie File Path"}</span>
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
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full p-2 pr-8 rounded-md border bg-background/50 font-mono text-xs truncate"
                                    value={settings.cookiePath || ''}
                                    readOnly
                                    placeholder="No file selected..."
                                />
                                {settings.cookiePath && (
                                    <button
                                        onClick={() => setSetting('cookiePath', '')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 transition-colors"
                                        title="Clear Path"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>



            {/* Danger Zone: Only visible if Developer Mode is on */}
            {settings.developerMode && (
                <section className="p-5 border border-red-500/20 rounded-xl bg-red-500/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-red-500">
                        Technical & Binary Paths
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">{getBinaryName('ytdlp')}</label>
                            <input className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.binaryPathYtDlp} onChange={e => setSetting('binaryPathYtDlp', e.target.value)} placeholder="Auto-managed" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">{getBinaryName('ffmpeg')}</label>
                            <input className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.binaryPathFfmpeg} onChange={e => setSetting('binaryPathFfmpeg', e.target.value)} placeholder="Auto-managed" />
                        </div>
                    </div>
                </section>
            )}

            {/* Data Management */}
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    {t.settings.advanced.data_management}
                </h3>

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
                                    alert("Export successful")
                                }
                            } catch (e) { alert("Export failed: " + e) }
                        }}
                        className="p-3 text-sm border rounded-xl hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                    >
                        <span className="font-medium">Export History</span>
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
                                        alert("Imported successfully")
                                    }
                                }
                            } catch (e) { alert("Import failed: " + e) }
                        }}
                        className="p-3 text-sm border rounded-xl hover:bg-secondary/50 transition-colors flex items-center justify-between group"
                    >
                        <span className="font-medium">Import History</span>
                    </button>

                    <button
                        onClick={() => {
                            if (confirm("Reset ALL settings to default?")) {
                                // Manual reset to defaults
                                updateSettings({
                                    theme: 'system',
                                    hardwareDecoding: true,
                                    developerMode: false,
                                    cookieSource: 'none'
                                })
                                window.location.reload()
                            }
                        }}
                        className="p-3 text-sm border rounded-xl hover:bg-red-500/10 hover:border-red-500/30 transition-colors flex items-center justify-between group text-red-500"
                    >
                        <span className="font-medium">Reset All Data</span>
                    </button>

                    <button
                        onClick={() => setSetting('hasSeenOnboarding', false)}
                        className="p-3 text-sm border rounded-xl hover:bg-emerald-500/10 transition-colors flex items-center justify-between group"
                    >
                        <span className="font-medium">Replay Welcome</span>
                    </button>
                </div>
            </section>
        </div>
    )
}
