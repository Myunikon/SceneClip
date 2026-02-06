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
    currentFormat
}) => {
    // Filtered presets
    const filteredPresets = presets.filter((p: PostProcessorPreset) => {
        if (currentFormat === 'audio') return p.type === 'audio' || p.type === 'general'
        return p.type === 'video' || p.type === 'general'
    })

    // Determine current preset value for dropdown
    const currentPresetArgs = filteredPresets.find(p => p.args === postProcessorArgs)?.args;
    // If it matches a preset, use the preset args. 
    // If it's set but not a preset, it's custom.
    // If not set, empty string (meaning "Select Preset" placeholder if we had one, or just empty).
    const isCustom = postProcessorArgs && !currentPresetArgs;
    const dropDownValue = currentPresetArgs || (isCustom ? '-custom-' : '');

    // Local state for custom input to avoid global re-render on every keystroke
    const [localCustomArgs, setLocalCustomArgs] = useState(isCustom ? postProcessorArgs : '');

    useEffect(() => {
        if (isCustom) {
            setLocalCustomArgs(postProcessorArgs);
        }
    }, [isCustom, postProcessorArgs]);

    const handleDropdownChange = (val: string) => {
        if (val === '-custom-') {
            // Initialize custom input with current value to preserve previous settings
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
                // Warn user about empty input
                notify.warning(t('dialog.custom_args_empty') || 'Custom arguments cleared');
            }
            setPostProcessorArgs(trimmed);
        }
    }

    const handleToggle = (isChecked: boolean) => {
        if (isChecked) {
            onChange(true);  // Notify parent that feature is enabled
            // Set default args if none set
            if (!postProcessorArgs) {
                const firstPreset = filteredPresets[0];
                setPostProcessorArgs(firstPreset?.args || '');  // Empty string, not '-custom-'
            }
        } else {
            onChange(false);
        }
    }

    return (
        <SettingCard
            icon={<Wand2 className="w-4 h-4" />}
            title={t('dialog.post_processing')}
            description={postProcessorArgs ? t('dialog.post_proc_active') : t('dialog.post_proc_desc')}
            checked={checked}
            onCheckedChange={handleToggle}
            onClick={() => handleToggle(!checked)}
            expandableContent={
                <div className="p-3 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                        <Wand2 className="w-3 h-3" /> {t('dialog.select_preset')}
                    </div>

                    <PopUpButton
                        value={dropDownValue}
                        onChange={handleDropdownChange}
                        options={[
                            { value: '-custom-', label: t('dialog.custom_preset') },
                            ...filteredPresets.map((preset) => ({
                                value: preset.args,
                                label: preset.name
                            }))
                        ]}
                        className="w-full"
                    />

                    {dropDownValue === '-custom-' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <label className="text-xs text-muted-foreground">{t('dialog.custom_args_label')}</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-white/50 transition-all placeholder:text-muted-foreground/50"
                                placeholder="-acodec libmp3lame -ab 320k"
                                value={localCustomArgs}
                                onChange={(e) => setLocalCustomArgs(e.target.value)}
                                onBlur={handleCustomArgsBlur}
                            />
                        </div>
                    )}

                    {postProcessorArgs && dropDownValue !== '-custom-' && (
                        <code className="block text-[10px] font-mono bg-black/30 p-2 rounded text-muted-foreground break-all border border-white/10">
                            {postProcessorArgs}
                        </code>
                    )}
                </div>
            }
        />
    )
}
