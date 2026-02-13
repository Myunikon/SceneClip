import { useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Select } from '@/components/ui'
import { Switch } from '@/components/ui'
import { AppSettings } from '@/store/slices/types'
import { PostProcessorPreset } from '@/types'
import { SettingItem, SettingSection } from './SettingItem'
import { Check, Plus, Trash2, X, Sliders } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, OverflowTooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'


interface MediaSettingsProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

const SEGMENT_OPTS = [
    { id: 'sponsor', label: 'Sponsor' },
    { id: 'selfpromo', label: 'Self-Promo' },
    { id: 'interaction', label: 'Interaction' },
    { id: 'intro', label: 'Intro' },
    { id: 'outro', label: 'Outro' },
    { id: 'preview', label: 'Preview' },
    { id: 'filler', label: 'Filler' },
    { id: 'music_offtopic', label: 'Music' }
]

export function MediaSettings({ settings, setSetting }: MediaSettingsProps) {
    const { t } = useTranslation()

    // Add Preset Form State
    const [isAddingPreset, setIsAddingPreset] = useState(false)
    const [newPreset, setNewPreset] = useState<Partial<PostProcessorPreset>>({
        type: 'video',
        name: '',
        description: '',
        args: '',
        isDefault: false
    })

    const handleAddPreset = () => {
        if (!newPreset.name || !newPreset.args) return

        const preset: PostProcessorPreset = {
            id: crypto.randomUUID(),
            name: newPreset.name || 'Untitled Preset',
            description: newPreset.description || '',
            type: (newPreset.type as any) || 'video',
            args: newPreset.args || '',
            isDefault: newPreset.isDefault || false
        }

        const current = settings.postProcessorPresets || []
        setSetting('postProcessorPresets', [...current, preset])

        // Reset and close
        setNewPreset({ type: 'video', name: '', description: '', args: '', isDefault: false })
        setIsAddingPreset(false)
    }

    const handleDeletePreset = (id: string) => {
        const current = settings.postProcessorPresets || []
        const currentEnabled = settings.enabledPresetIds || []
        setSetting('postProcessorPresets', current.filter(p => p.id !== id))
        setSetting('enabledPresetIds', currentEnabled.filter(eid => eid !== id))
    }

    const toggleGlobalPreset = (id: string) => {
        const current = settings.enabledPresetIds || []
        if (current.includes(id)) {
            setSetting('enabledPresetIds', current.filter(eid => eid !== id))
        } else {
            setSetting('enabledPresetIds', [...current, id])
        }
    }

    return (
        <div className="space-y-6">


            {/* Video Content Section */}
            <SettingSection title={t('settings.quality.video')}>
                <div className="grid grid-cols-2 gap-4">
                    <SettingItem title={t('settings.quality.resolution')} layout="vertical">
                        <Select
                            value={settings.resolution}
                            onChange={(val) => setSetting('resolution', val)}
                            options={[
                                { value: 'best', label: t('settings.downloads.best') || "Best Available" },
                                { value: '2160', label: '4K (2160p)' },
                                { value: '1440', label: '2K (1440p)' },
                                { value: '1080', label: 'Full HD (1080p)' },
                                { value: '720', label: 'HD (720p)' },
                                { value: '480', label: 'SD (480p)' },
                                { value: 'audio', label: t('settings.quality.audio') || "Audio Only" }
                            ]}
                        />
                    </SettingItem>
                    <SettingItem title={t('settings.quality.container')} layout="vertical">
                        <Select
                            value={settings.container}
                            onChange={(val) => setSetting('container', val as AppSettings['container'])}
                            options={[
                                { value: 'mp4', label: 'MP4 (Universal)' },
                                { value: 'mkv', label: 'MKV (Advanced)' },
                                { value: 'webm', label: 'WebM (Google)' },
                                { value: 'mov', label: 'QuickTime (MOV)' }
                            ]}
                        />
                    </SettingItem>
                </div>

                <SettingItem
                    title={t('settings.quality.sponsorblock') || "SponsorBlock"}
                    description={t('settings.quality.sponsorblock_desc')}
                    border
                >
                    <Switch
                        checked={settings.useSponsorBlock}
                        onCheckedChange={(val) => setSetting('useSponsorBlock', val)}
                    />
                </SettingItem>

                {settings.useSponsorBlock && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                            {t('settings.quality.skip_segments')}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {SEGMENT_OPTS.map(segment => {
                                const isActive = (settings.sponsorSegments || []).includes(segment.id)
                                return (
                                    <button
                                        key={segment.id}
                                        role="switch"
                                        aria-checked={isActive}
                                        onClick={() => {
                                            const current = settings.sponsorSegments || []
                                            const updated = isActive
                                                ? current.filter(s => s !== segment.id)
                                                : [...current, segment.id]
                                            setSetting('sponsorSegments', updated)
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all border",
                                            isActive
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                : "bg-background text-muted-foreground border-border/60 hover:border-primary/30 hover:bg-muted/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-3.5 h-3.5 rounded-full flex items-center justify-center border",
                                            isActive ? "border-primary-foreground/30 bg-primary-foreground/20" : "border-muted-foreground/30"
                                        )}>
                                            {isActive && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                        {segment.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </SettingSection>



            {/* Metadata Section */}
            <SettingSection title={t('settings.quality.metadata') || "Metadata"}>
                <div className="space-y-1">
                    <SettingItem title={t('settings.quality.embed_metadata')} description={t('settings.quality.embed_metadata_desc')}>
                        <Switch checked={settings.embedMetadata} onCheckedChange={(val) => setSetting('embedMetadata', val)} />
                    </SettingItem>
                    <SettingItem title={t('settings.quality.embed_thumbnail')} description={t('settings.quality.embed_thumbnail_desc')}>
                        <Switch checked={settings.embedThumbnail} onCheckedChange={(val) => setSetting('embedThumbnail', val)} />
                    </SettingItem>
                    <SettingItem title={t('settings.quality.embed_chapters')} description={t('settings.quality.embed_chapters_desc')}>
                        <Switch checked={settings.embedChapters} onCheckedChange={(val) => setSetting('embedChapters', val)} />
                    </SettingItem>

                    {/* Moved Metadata Enhancer from Advanced */}
                    {/* Moved Metadata Enhancer from Advanced */}
                    <SettingItem
                        title={t('settings.advanced.content_enhancements.metadata_enhancer') || "Metadata Enhancer"}
                        description={t('settings.advanced.content_enhancements.metadata_enhancer_desc')}
                    >
                        <Switch
                            checked={settings.useMetadataEnhancer}
                            onCheckedChange={(val) => setSetting('useMetadataEnhancer', val)}
                        />
                    </SettingItem>

                    <SettingItem
                        title={t('settings.quality.privacy_scrubbing') || "Privacy Scrubbing"}
                        description={t('settings.quality.privacy_scrubbing_desc') || "Remove source URL, description, and comments from downloaded files."}
                    >
                        <Switch
                            checked={settings.removeSourceMetadata}
                            onCheckedChange={(val) => setSetting('removeSourceMetadata', val)}
                        />
                    </SettingItem>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border/50 flex gap-3">
                    <div className="text-amber-500 shrink-0 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground block mb-0.5">{t('settings.quality.metadata_warning_title')}</span>
                        <Trans i18nKey="settings.quality.metadata_warning_desc" components={{ 1: <strong className="text-amber-500" /> }} />
                    </div>
                </div>
            </SettingSection>

            {/* Post-Processing Presets */}
            <SettingSection
                title={
                    <div className="flex items-center justify-between w-full">
                        <span>{t('settings.quality.presets.title')}</span>
                        {!isAddingPreset && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setIsAddingPreset(true)}
                                        className="text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('settings.quality.presets.add_tooltip')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                }
                description={t('settings.quality.presets.desc')}
            >
                {/* Presets List */}
                <div className="divide-y divide-border/40 border border-border/40 rounded-xl overflow-hidden bg-card/30">
                    {settings.postProcessorPresets?.length === 0 && !isAddingPreset && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {t('settings.quality.presets.empty')}
                        </div>
                    )}

                    {settings.postProcessorPresets?.map(preset => (
                        <div key={preset.id} className="group flex items-center justify-between p-3.5 hover:bg-secondary/30 transition-colors">
                            <div className="min-w-0 flex-1 mr-4">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <OverflowTooltip content={preset.name} className="font-medium text-sm">
                                        {preset.name}
                                    </OverflowTooltip>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full border uppercase font-bold tracking-wider shrink-0",
                                        preset.type === 'audio' ? "text-purple-500 border-purple-500/20 bg-purple-500/5" :
                                            preset.type === 'video' ? "text-blue-500 border-blue-500/20 bg-blue-500/5" :
                                                "text-gray-500 border-gray-500/20 bg-gray-500/5"
                                    )}>
                                        {preset.type}
                                    </span>
                                </div>
                                <OverflowTooltip
                                    content={preset.description || t('settings.quality.presets.desc_label')}
                                    className="text-xs text-muted-foreground opacity-80 mb-1.5"
                                >
                                    {preset.description || t('settings.quality.presets.desc_label')}
                                </OverflowTooltip>
                                <code className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground font-mono inline-block">
                                    {preset.args}
                                </code>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => toggleGlobalPreset(preset.id)}
                                            className={cn(
                                                "p-2 rounded-lg transition-all border",
                                                settings.enabledPresetIds?.includes(preset.id)
                                                    ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]"
                                                    : "border-border/40 text-muted-foreground hover:border-border/80 hover:bg-secondary/50"
                                            )}
                                        >
                                            <Check className={cn("w-4 h-4 transition-transform", settings.enabledPresetIds?.includes(preset.id) ? "scale-110" : "scale-90 opacity-40")} />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{settings.enabledPresetIds?.includes(preset.id) ? "Globally Enabled" : "Enable Globally"}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handleDeletePreset(preset.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('settings.quality.presets.delete_tooltip')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Preset Form */}
                {isAddingPreset && (
                    <div className="mt-4 rounded-xl border border-border/50 bg-card shadow-sm animate-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-border/40 bg-muted/30 flex items-center justify-between rounded-t-xl">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-primary" />
                                {t('settings.quality.presets.add_new')}
                            </h4>
                            <button
                                onClick={() => setIsAddingPreset(false)}
                                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-background/50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">{t('settings.quality.presets.name_label')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                                        placeholder={t('settings.quality.presets.placeholder_name')}
                                        value={newPreset.name}
                                        onChange={e => setNewPreset({ ...newPreset, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">{t('settings.quality.presets.type_label')}</label>
                                    <Select
                                        value={newPreset.type || 'video'}
                                        onChange={val => setNewPreset({ ...newPreset, type: val as any })}
                                        options={[
                                            { value: 'video', label: t('settings.quality.presets.types.video') },
                                            { value: 'audio', label: t('settings.quality.presets.types.audio') },
                                            { value: 'metadata', label: t('settings.quality.presets.types.metadata') },
                                            { value: 'general', label: t('settings.quality.presets.types.general') }
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">{t('settings.quality.presets.args_label')}</label>
                                <input
                                    type="text"
                                    className="w-full font-mono bg-background border border-input rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder={t('settings.quality.presets.placeholder_args')}
                                    value={newPreset.args}
                                    onChange={e => setNewPreset({ ...newPreset, args: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">{t('settings.quality.presets.desc_label')}</label>
                                <input
                                    type="text"
                                    className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                                    placeholder={t('settings.quality.presets.placeholder_desc')}
                                    value={newPreset.description}
                                    onChange={e => setNewPreset({ ...newPreset, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={handleAddPreset}
                                    disabled={!newPreset.name || !newPreset.args}
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    {t('settings.quality.presets.save_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </SettingSection>
        </div>
    )
}
