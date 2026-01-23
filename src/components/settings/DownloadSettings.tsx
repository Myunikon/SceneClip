import { Switch } from '../Switch'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { AppSettings } from '../../store/slices/types'

interface DownloadSettingsProps {
    settings: AppSettings
    setSetting: (key: string, val: any) => void
    t: any
}

export function DownloadSettings({ settings, setSetting, t }: DownloadSettingsProps) {
    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">

            <section className="p-5 border border-border rounded-xl bg-white/50 dark:bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                    {t.settings.downloads.storage}
                </h3>
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">{t.settings.downloads.path}</label>
                    <div className="flex gap-2">
                        <input className="flex-1 p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.downloadPath || 'Downloads'} readOnly />
                        <button onClick={async () => {
                            const p = await openDialog({ directory: true })
                            if (p) setSetting('downloadPath', p)
                        }} className="px-3 border rounded-md hover:bg-secondary transition-colors">{t.settings.downloads.change}</button>
                    </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-secondary/30 rounded-lg transition-colors">
                    <Switch checked={settings.alwaysAskPath} onCheckedChange={val => setSetting('alwaysAskPath', val)} />
                    <span>{t.settings.downloads.always_ask}</span>
                </label>


            </section>



            <section className="p-5 border border-border rounded-xl bg-white/50 dark:bg-card/30 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                    {t.settings.downloads.defaults}
                </h3>
                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">{t.settings.downloads.filename_template}</label>
                    <input className="w-full p-2 rounded-md border bg-background/50 font-mono text-xs focus:ring-1 focus:ring-primary outline-none"
                        value={settings.filenameTemplate}
                        onChange={e => setSetting('filenameTemplate', e.target.value)}
                        placeholder="{Title}.{ext}"
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                        {['{Title}', '{Uploader}', '{Ext}', '{Id}', '{Width}', '{Height}'].map(variable => (
                            <button
                                key={variable}
                                onClick={() => setSetting('filenameTemplate', settings.filenameTemplate + variable)}
                                className="px-2 py-1 bg-secondary hover:bg-primary/20 text-xs font-mono rounded border transition-colors"
                            >
                                {variable}
                            </button>
                        ))}
                    </div>
                </div>

            </section>
        </div>
    )
}
