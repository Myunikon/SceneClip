import { Switch } from '../Switch'
import { Select } from '../Select' // Reused for "Insert Variable"
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { useTranslation } from 'react-i18next'
import { AppSettings } from '../../store/slices/types'
import { SettingItem, SettingSection } from './SettingItem'
import { Folder, FileText } from 'lucide-react'

interface DownloadSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

export function DownloadSettings({ settings, setSetting }: DownloadSettingsProps) {
    const { t } = useTranslation()

    const handleInsertToken = (token: string) => {
        const current = settings.filenameTemplate || '{Title}.{ext}'
        // Append token, ensuring we handle potential lack of selection gracefully by just appending
        setSetting('filenameTemplate', current + token)
    }

    // Mock preview logic
    const getPreview = () => {
        const mockValues: Record<string, string> = {
            '{Title}': t('filename_preview.example_title') || 'My Awesome Video',
            '{Uploader}': t('filename_preview.example_uploader') || 'CoolCreator',
            '{Ext}': 'mp4',
            '{Id}': 'dQw4w9WgXcQ',
            '{Width}': '1920',
            '{Height}': '1080',
            '{Date}': '20230101'
        }
        let preview = settings.filenameTemplate || '{Title}.{ext}'
        Object.entries(mockValues).forEach(([key, val]) => {
            preview = preview.replace(new RegExp(key, 'gi'), val)
        })
        return preview
    }

    return (
        <div className="space-y-6">

            <SettingSection title={t('settings.downloads.storage')}>
                <div className="space-y-4">
                    {/* Path Selector - Mac Style */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden mr-4">
                            <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                                <Folder className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                                    {t('downloads.path_select_label')}
                                </span>
                                <span className="text-sm font-medium truncate font-mono" title={settings.downloadPath || 'Downloads'}>
                                    {settings.downloadPath || 'Downloads'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                const p = await openDialog({ directory: true })
                                if (p) setSetting('downloadPath', p)
                            }}
                            className="bg-secondary/80 hover:bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-xs font-medium border border-border/50 transition-colors whitespace-nowrap"
                        >
                            {t('downloads.change_folder')}
                        </button>
                    </div>

                    <SettingItem
                        title={t('settings.downloads.always_ask')}
                        className="hover:bg-secondary/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <Switch checked={settings.alwaysAskPath} onCheckedChange={val => setSetting('alwaysAskPath', val)} />
                    </SettingItem>
                </div>
            </SettingSection>

            <SettingSection title={t('settings.downloads.defaults')}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">{t('settings.downloads.filename_template')}</label>
                            {/* Insert Token Menu */}
                            <div className="w-40">
                                <Select
                                    value=""
                                    onChange={handleInsertToken}
                                    placeholder={t('downloads.insert_token')}
                                    options={[
                                        { value: '{Title}', label: t('downloads.tokens.title') },
                                        { value: '{Uploader}', label: t('downloads.tokens.uploader') },
                                        { value: '{Ext}', label: t('downloads.tokens.ext') },
                                        { value: '{Id}', label: t('downloads.tokens.id') },
                                        { value: '{Width}', label: t('downloads.tokens.width') },
                                        { value: '{Height}', label: t('downloads.tokens.height') },
                                        { value: '{Date}', label: t('downloads.tokens.date') }
                                    ]}
                                    className="h-8 text-xs bg-background"
                                />
                            </div>
                        </div>

                        <input
                            className="w-full p-2.5 rounded-lg border bg-background text-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                            value={settings.filenameTemplate}
                            onChange={e => setSetting('filenameTemplate', e.target.value)}
                            placeholder="{Title}.{ext}"
                        />

                        {/* Live Preview - Cleaner */}
                        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2 pl-1">
                            <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                            <div>
                                <span className="font-semibold text-foreground/80 mr-1.5">{t('filename_preview.label')}:</span>
                                <span className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded text-foreground/90 break-all">
                                    {getPreview()}
                                </span>
                                <div className="mt-1 opacity-60 text-[10px]">
                                    {t('settings.downloads.example_note')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingSection>

        </div>
    )
}
