import { AlertCircle, Scissors, Database, ChevronRight } from 'lucide-react'
import { Select } from '../Select'
import { Switch } from '../Switch'
import { AppSettings } from '../../store/slices/types'
import { DEFAULT_SETTINGS } from '../../store/slices/createSettingsSlice'
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
                        <div className="pt-2 animate-in slide-in-from-top-1">
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
                    <div className="grid grid-cols-2 gap-2 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-top-1">
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
                    <div className="pt-2 pl-4 border-l-2 border-red-500/20 mt-2 space-y-2 animate-in slide-in-from-top-1">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">{getBinaryName('ytdlp')}</label>
                            <input className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.binaryPathYtDlp} onChange={e => setSetting('binaryPathYtDlp', e.target.value)} placeholder="Auto-managed" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground">{getBinaryName('ffmpeg')}</label>
                            <input className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.binaryPathFfmpeg} onChange={e => setSetting('binaryPathFfmpeg', e.target.value)} placeholder="Auto-managed" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{t.settings.advanced.danger_desc}</p>
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
                            if (confirm(t.settings.advanced.confirm_redownload?.replace('Redownload', 'Reset') || "Are you sure you want to reset all settings to defaults?")) {
                                updateSettings(DEFAULT_SETTINGS)
                                window.location.reload() // Reload to apply clean state
                            }
                        }}
                        className="text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors font-medium border border-transparent hover:border-red-500/20"
                    >
                        Reset to Defaults
                    </button>
                </div>
            </section>
            <div className="pt-6 border-t border-border/50">
                <h3 className="text-sm font-medium mb-3 text-purple-400">Developer Tools</h3>
                <div className="bg-secondary/20 p-4 rounded-xl space-y-4">
                    {/* Developer Mode Toggle */}
                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-secondary/30 rounded-lg transition-colors">
                        <div>
                            <div className="font-medium">Developer Mode</div>
                            <div className="text-xs text-muted-foreground">
                                {t.settings.advanced.developer_mode_desc || 'Show command details on each download task'}
                            </div>
                        </div>
                        <Switch 
                            checked={settings.developerMode} 
                            onCheckedChange={val => setSetting('developerMode', val)} 
                        />
                    </label>

                    {/* Web Inspector */}
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-border/50">
                        <div>
                            <div className="font-medium">Web Inspector</div>
                            <div className="text-xs text-muted-foreground">Open browser DevTools for debugging</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">F12</kbd>
                            <span className="text-muted-foreground text-xs">or</span>
                            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">Ctrl+Shift+I</kbd>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
