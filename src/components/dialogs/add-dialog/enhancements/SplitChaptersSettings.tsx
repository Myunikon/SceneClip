import React from 'react'
import { List } from 'lucide-react'
import { SettingCard } from '../../../common'

interface SplitChaptersSettingsProps {
    t: (key: string) => string
    checked: boolean
    onChange: (checked: boolean) => void
    showSequentialModeDesc?: boolean
}

export const SplitChaptersSettings: React.FC<SplitChaptersSettingsProps> = ({
    t,
    checked,
    onChange,
    showSequentialModeDesc
}) => {
    return (
        <SettingCard
            icon={<List className="w-4 h-4" />}
            title={t('dialog.split_chapters')}
            description={showSequentialModeDesc ? t('dialog.sequential_mode') : undefined}
            checked={checked}
            onCheckedChange={onChange}
        />
    )
}
