import React, { useState, useEffect } from 'react'
import { Wand2 } from 'lucide-react'
import { SettingCard } from '../../../common'
import { PopUpButton } from '../../../ui'
import { notify } from '../../../../lib/notify'
import type { PostProcessorPreset } from '../../../../types'

interface PostProcessingSettingsProps {
    t: (key: string) => string
    checked: boolean
    onChange: (checked: boolean) => void
    postProcessorArgs: string | undefined
    setPostProcessorArgs: (args: string) => void
    presets: PostProcessorPreset[]
    currentFormat: string
}

export const PostProcessingSettings: React.FC<PostProcessingSettingsProps> = ({
    t,
    checked,
    onChange,
    postProcessorArgs,
    setPostProcessorArgs,
    presets,
    currentFormat: _currentFormat
}) => {
    // Show ALL presets (no format-based filtering) to keep in sync with Settings
    const allPresets = presets;

    // Determine Logic
    const currentPreset = allPresets.find(p => p.args === postProcessorArgs);
    const isCustom = !!postProcessorArgs && !currentPreset;
    const dropDownValue = currentPreset?.args || (isCustom ? '-custom-' : '');

    // Local state for custom input
    const [localCustomArgs, setLocalCustomArgs] = useState(isCustom ? postProcessorArgs : '');

    useEffect(() => {
        if (isCustom) {
            setLocalCustomArgs(postProcessorArgs || '');
        }
    }, [isCustom, postProcessorArgs]);

    const handleDropdownChange = (val: string) => {
        if (val === '-custom-') {
            const initialValue = postProcessorArgs || '';
            setLocalCustomArgs(initialValue);
            setPostProcessorArgs(initialValue);
        } else {
            setPostProcessorArgs(val);
        }
    }

    const handleCustomArgsBlur = () => {
        const trimmed = localCustomArgs.trim();
        if (trimmed !== postProcessorArgs) {
            if (!trimmed && postProcessorArgs) {
                notify.warning(t('dialog.custom_args_empty') || 'Custom arguments cleared');
            }
            setPostProcessorArgs(trimmed);
        }
    }

    const handleToggle = (isChecked: boolean) => {
        onChange(isChecked);
        if (isChecked && !postProcessorArgs) {
            // Apply first preset safely if available
            if (allPresets.length > 0) {
                setPostProcessorArgs(allPresets[0].args);
            }
        }
    }

    return (
        <SettingCard
            icon={<Wand2 className="w-4 h-4" />}
            title={t('dialog.post_processing')}
            description={postProcessorArgs ? t('dialog.post_proc_active') : t('dialog.post_proc_desc')}
            checked={checked}
            onCheckedChange={handleToggle}
            expandableContent={
                <div className="p-3 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                        <Wand2 className="w-3 h-3" /> {t('dialog.select_preset')}
                    </div>

                    <PopUpButton
                        value={dropDownValue}
                        onChange={handleDropdownChange}
                        options={allPresets.map((preset) => ({
                            value: preset.args,
                            label: `${preset.name} [${preset.type.toUpperCase()}]`
                        }))}
                        className="w-full"
                    />

                    {dropDownValue === '-custom-' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <label className="text-xs text-muted-foreground">{t('dialog.custom_args_label')}</label>
                            <input
                                type="text"
                                className="w-full bg-secondary/30 dark:bg-black/20 border border-border/60 dark:border-white/10 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                                placeholder="-acodec libmp3lame -ab 320k"
                                value={localCustomArgs}
                                onChange={(e) => setLocalCustomArgs(e.target.value)}
                                onBlur={handleCustomArgsBlur}
                            />
                        </div>
                    )}

                    {postProcessorArgs && dropDownValue !== '-custom-' && (
                        <code className="block text-[10px] font-mono bg-secondary/50 dark:bg-black/30 p-2 rounded text-muted-foreground break-all border border-border/60 dark:border-white/10">
                            {postProcessorArgs}
                        </code>
                    )}
                </div>
            }
        />
    )
}
