import { Switch } from '../Switch'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { useTranslation } from 'react-i18next'
import { AppSettings } from '../../store/slices/types'
import { SettingItem, SettingSection } from './SettingItem'

interface DownloadSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

export function DownloadSettings({ settings, setSetting }: DownloadSettingsProps) {
    const { t } = useTranslation()

    return (
        <div className="space-y-4">

            <SettingSection title={t('settings.downloads.storage')}>
                <SettingItem title={t('settings.downloads.path')} layout="vertical">
                    <div className="flex gap-2">
                        <input className="flex-1 p-2 rounded-md border bg-background/50 font-mono text-xs" value={settings.downloadPath || 'Downloads'} readOnly />
                        <button onClick={async () => {
                            const p = await openDialog({ directory: true })
                            if (p) setSetting('downloadPath', p)
                        }} className="px-3 border rounded-md hover:bg-secondary transition-colors whitespace-nowrap">{t('settings.downloads.change')}</button>
                    </div>
                </SettingItem>
                <SettingItem
                    title={t('settings.downloads.always_ask')}
                    className="hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer"
                >
                    <Switch checked={settings.alwaysAskPath} onCheckedChange={val => setSetting('alwaysAskPath', val)} />
                </SettingItem>
            </SettingSection>

            <SettingSection title={t('settings.downloads.defaults')}>
                <div className="space-y-3">
                    <SettingItem title={t('settings.downloads.filename_template')} layout="vertical">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 p-2.5 rounded-lg border bg-background/50 font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                value={settings.filenameTemplate}
                                onChange={e => setSetting('filenameTemplate', e.target.value)}
                                placeholder="{Title}.{ext}"
                            />
                            <button
                                onClick={() => setSetting('filenameTemplate', '{Title}.{ext}')}
                                className="px-3 py-2 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-lg border border-border transition-colors text-muted-foreground whitespace-nowrap"
                                title={t('filename_preview.reset')}
                            >
                                {t('filename_preview.reset')}
                            </button>
                        </div>
                    </SettingItem>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2">
                        {['{Title}', '{Uploader}', '{Ext}', '{Id}', '{Width}', '{Height}'].map(variable => (
                            <button
                                key={variable}
                                onClick={() => setSetting('filenameTemplate', settings.filenameTemplate + variable)}
                                className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold font-mono rounded-md border border-primary/20 transition-all hover:scale-105"
                            >
                                {variable}
                            </button>
                        ))}
                    </div>

                    {/* Live Preview */}
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('filename_preview.label')}</div>
                        <div className="font-mono text-xs text-foreground/80 break-all bg-background/50 p-2 rounded border border-border/50">
                            {(() => {
                                const mockValues = {
                                    '{Title}': t('filename_preview.example_title') || 'My Awesome Video',
                                    '{Uploader}': t('filename_preview.example_uploader') || 'CoolCreator',
                                    '{Ext}': 'mp4',
                                    '{Id}': 'dQw4w9WgXcQ',
                                    '{Width}': '1920',
                                    '{Height}': '1080'
                                }
                                let preview = settings.filenameTemplate || '{Title}.{ext}'
                                Object.entries(mockValues).forEach(([key, val]) => {
                                    // Case insensitive replace for preview
                                    preview = preview.replace(new RegExp(key, 'gi'), val)
                                })
                                return preview
                            })()}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 italic">
                            {t('settings.downloads.example_note') || "* Example based on a sample video"}
                        </div>
                    </div>
                </div>
            </SettingSection>
        </div>
    )
}
