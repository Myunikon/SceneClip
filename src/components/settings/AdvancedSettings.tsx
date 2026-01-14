import { AlertCircle, Scissors, Database, ChevronRight, Download, Upload, Trash2, Rocket } from 'lucide-react'
import { clearCache } from '../../lib/ytdlp'
import { Select } from '../Select'
import { Switch } from '../Switch'
import { AppSettings } from '../../store/slices/types'
import { DEFAULT_SETTINGS } from '../../store/slices/createSettingsSlice'
import { getBinaryName } from '../../lib/platform'
import { useAppStore } from '../../store'
import { cn } from '../../lib/utils'

interface AdvancedSettingsProps {
    settings: AppSettings
    setSetting: (key: string, val: any) => void
    updateSettings: (newSettings: Partial<AppSettings>) => void
    t: any
}

export function AdvancedSettings({ settings, setSetting, updateSettings, t }: AdvancedSettingsProps) {
    return (
        <div className={cn("space-y-4", !settings.lowPerformanceMode && "animate-in slide-in-from-right-4 duration-300")}>
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary"/> {t.settings.advanced.auth}
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
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                                Export cookies in Netscape format using "Get cookies.txt LOCALLY" extension. 
                                <br />
                                Warning: Keep this file private!
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-primary"/> {t.settings.advanced.sponsorblock}
                </h3>
                <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-secondary/30 rounded-lg transition-colors">
                    <span>{t.settings.advanced.enable_sb}</span>
                    <Switch checked={settings.useSponsorBlock} onCheckedChange={val => setSetting('useSponsorBlock', val)} />
                </label>
                {settings.useSponsorBlock && (
                    <div className="grid grid-cols-2 gap-2 pl-4 border-l-2 border-primary/20">
                        {['sponsor', 'intro', 'outro', 'selfpromo', 'preview', 'interaction'].map(seg => (
                            <label key={seg} className="flex items-center gap-2 text-xs uppercase cursor-pointer hover:text-primary transition-colors">
                                <Switch 
                                    checked={settings.sponsorSegments.includes(seg)}
                                    onCheckedChange={checked => {
                                        const newSegs = checked 
                                            ? [...settings.sponsorSegments, seg]
                                            : settings.sponsorSegments.filter(s => s !== seg)
                                        setSetting('sponsorSegments', newSegs)
                                    }}
                                />
                                {seg}
                            </label>
                        ))}
                    </div>
                )}
            </section>
            
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary"/> {t.settings.advanced.binary_paths}
                </h3>
                
                <details className="group">
                    <summary className="text-xs font-bold text-red-500 uppercase cursor-pointer flex items-center gap-1 list-none select-none hover:opacity-80">
                        <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90"/>
                        {t.settings.advanced.danger_zone_binaries}
                    </summary>
                    <div className="pt-2 pl-4 border-l-2 border-red-500/20 mt-2 space-y-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">{getBinaryName('ytdlp')}</label>
                            <input className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.binaryPathYtDlp} onChange={e => setSetting('binaryPathYtDlp', e.target.value)} placeholder="Auto-managed" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">{getBinaryName('ffmpeg')}</label>
                            <input className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.binaryPathFfmpeg} onChange={e => setSetting('binaryPathFfmpeg', e.target.value)} placeholder="Auto-managed" />
                        </div>
                        <p className="text-xs text-muted-foreground">{t.settings.advanced.danger_desc}</p>
                    </div>
                </details>

                <div className="pt-2 border-t border-border/50">
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">{t.settings.advanced.post_action}</label>
                    <Select 
                        value={settings.postDownloadAction || 'none'} 
                        onChange={val => setSetting('postDownloadAction', val)}
                        options={[
                            { value: "none", label: t.settings.advanced.post_actions.none },
                            { value: "sleep", label: t.settings.advanced.post_actions.sleep },
                            { value: "shutdown", label: t.settings.advanced.post_actions.shutdown }
                        ]}
                    />
                </div>

                <div className="pt-4 flex justify-end gap-2 text-xs">
                    <button 
                        onClick={() => {
                            // Inline confirmation logic
                            const btn = document.getElementById('reset-btn')
                            if (btn && btn.dataset.confirm === 'true') {
                                updateSettings(DEFAULT_SETTINGS)
                                window.location.reload()
                            } else if (btn) {
                                btn.dataset.confirm = 'true'
                                btn.innerText = t.settings.advanced.alerts?.confirm_reset_short || "Click Again to Confirm"
                                btn.classList.remove('text-red-500', 'hover:bg-red-500/10')
                                btn.classList.add('bg-red-500', 'text-white', 'hover:bg-red-600')
                                
                                setTimeout(() => {
                                    if(btn) {
                                        btn.dataset.confirm = 'false'
                                        btn.innerText = t.settings.advanced.reset_defaults
                                        btn.classList.add('text-red-500', 'hover:bg-red-500/10')
                                        btn.classList.remove('bg-red-500', 'text-white', 'hover:bg-red-600')
                                    }
                                }, 3000)
                            }
                        }}
                        id="reset-btn"
                        className="text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors font-medium border border-transparent hover:border-red-500/20"
                    >
                        {t.settings.advanced.reset_defaults}
                    </button>
                </div>
            </section>
            
            {/* Video Processing */}
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                 <h3 className="font-semibold text-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500"/> {t.settings.advanced.video_processing?.title || "Video Processing"}
                </h3>
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">{t.settings.advanced.video_processing?.hw_accel || "Hardware Acceleration"}</label>
                    <Select 
                        value={settings.hardwareDecoding || 'auto'} 
                        onChange={val => setSetting('hardwareDecoding', val)}
                        options={[
                            { value: "auto", label: t.settings.advanced.video_processing?.hw_auto || "Auto (Recommended)" },
                            { value: "gpu", label: t.settings.advanced.video_processing?.hw_gpu || "Force GPU (NVENC/AMF/QSV)" },
                            { value: "cpu", label: t.settings.advanced.video_processing?.hw_cpu || "Force CPU (Slow but Safe)" }
                        ]}
                    />
                    <p className="text-xs text-muted-foreground">
                        {t.settings.advanced.video_processing?.hw_desc || "Controls whether to use your graphics card for video encoding. 'Auto' falls back to CPU if GPU fails."}
                    </p>
                </div>
            </section>

            {/* Developer Tools */}
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-purple-500"/> {t.settings.advanced.developer_tools}
                </h3>
                <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-secondary/30 rounded-lg transition-colors">
                    <div>
                        <div className="font-medium">{t.settings.advanced.developer_mode}</div>
                        <div className="text-xs text-muted-foreground">
                            {t.settings.advanced.developer_mode_desc}
                        </div>
                    </div>
                    <Switch 
                        checked={settings.developerMode} 
                        onCheckedChange={val => setSetting('developerMode', val)} 
                    />
                </label>

            </section>
            {/* Data Management */}
            <section className="p-5 border rounded-xl bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" /> {t.settings.advanced.data_management}
                </h3>
                <div className="flex items-center justify-between p-2 hover:bg-secondary/30 rounded-lg transition-colors">
                    <div>
                        <div className="font-medium">{t.settings.advanced.export_history}</div>
                        <div className="text-xs text-muted-foreground">{t.settings.advanced.export_desc}</div>
                    </div>
                    <button 
                        onClick={async () => {
                            try {
                                const { save } = await import('@tauri-apps/plugin-dialog')
                                const { writeTextFile } = await import('@tauri-apps/plugin-fs')
                                const { tasks } = useAppStore.getState()
                                
                                const path = await save({
                                    filters: [{ name: 'JSON', extensions: ['json'] }],
                                    defaultPath: 'clipscene_history_backup.json'
                                })
                                
                                if (path) {
                                    const data = JSON.stringify({
                                        version: 1,
                                        date: new Date().toISOString(),
                                        tasks
                                    }, null, 2)
                                    await writeTextFile(path, data)
                                    alert(t.settings.advanced.alerts.export_success)
                                }
                            } catch (e) {
                                console.error('Export failed', e)
                                alert(t.settings.advanced.alerts.export_fail + e)
                            }
                        }}
                        className="text-xs px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                    >
                        <Download className="w-3.5 h-3.5" />
                        {t.settings.advanced.export_btn}
                    </button>
                </div>

                <div className="border-t border-border/30 pt-3 flex items-center justify-between p-2 hover:bg-secondary/30 rounded-lg transition-colors">
                    <div>
                        <div className="font-medium">{t.settings.advanced.import_history}</div>
                        <div className="text-xs text-muted-foreground">{t.settings.advanced.import_desc}</div>
                    </div>
                    <button 
                        onClick={async () => {
                            try {
                                const { open } = await import('@tauri-apps/plugin-dialog')
                                const { readTextFile } = await import('@tauri-apps/plugin-fs')
                                
                                const path = await open({
                                    filters: [{ name: 'JSON', extensions: ['json'] }]
                                })
                                
                                if (path && typeof path === 'string') {
                                    const content = await readTextFile(path)
                                    const data = JSON.parse(content)
                                    
                                    if (data && Array.isArray(data.tasks)) {
                                        useAppStore.getState().importTasks(data.tasks)
                                        alert(t.settings.advanced.alerts.import_success.replace('{n}', data.tasks.length))
                                    } else {
                                        alert(t.settings.advanced.alerts.invalid_backup)
                                    }
                                }
                            } catch (e) {
                                console.error('Import failed', e)
                                alert(t.settings.advanced.alerts.import_fail + e)
                            }
                        }}
                        className="text-xs px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        {t.settings.advanced.import_btn}
                    </button>
                </div>

                <div className="border-t border-border/30 pt-3 flex items-center justify-between p-2 hover:bg-secondary/30 rounded-lg transition-colors">
                    <div>
                        <div className="font-medium">{t.settings.advanced.replay_onboarding || "Replay Onboarding"}</div>
                        <div className="text-xs text-muted-foreground">{t.settings.advanced.replay_desc || "Show the welcome screen again"}</div>
                    </div>
                    <button 
                        onClick={() => {
                            setSetting('hasSeenOnboarding', false)
                            // Onboarding component watches this state and will appear immediately
                            // We might want to close settings modal too, but the overlay will cover it anyway
                        }}
                        className="text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                    >
                        <Rocket className="w-3.5 h-3.5" />
                        {t.settings.advanced.replay_btn || "Replay"}
                    </button>
                </div>

                <div className="border-t border-border/30 pt-3 flex items-center justify-between p-2 hover:bg-secondary/30 rounded-lg transition-colors">
                    <div>
                        <div className="font-medium">{t.settings.advanced.clear_cache || "Clear Internal Cache"}</div>
                        <div className="text-xs text-muted-foreground">{t.settings.advanced.clear_cache_desc || "Frees up space by removing temporary yt-dlp files"}</div>
                    </div>
                    <button 
                        onClick={async () => {
                            try {
                                const { notify } = await import('../../lib/notify')
                                await clearCache()
                                notify.success(t.settings.advanced.alerts?.cache_cleared || "Cache Cleared Successfully")

                            } catch (e) {
                                console.error('Cache clear failed', e)
                                const { notify } = await import('../../lib/notify')
                                notify.error("Failed to clear cache", { description: String(e) })
                            }
                        }}
                        className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t.settings.advanced.clear_btn || "Clear"}
                    </button>
                </div>
            </section>

        </div>
    )
}
