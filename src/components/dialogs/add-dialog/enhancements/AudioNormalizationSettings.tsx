import React from 'react'
import { Music } from 'lucide-react'
import { SettingCard } from '../../../common'

interface AudioNormalizationSettingsProps {
    t: (key: string) => string
    checked: boolean
    onChange: (checked: boolean) => void
}

export const AudioNormalizationSettings: React.FC<AudioNormalizationSettingsProps> = ({
    t,
    checked,
    onChange
}) => {
    return (
        <SettingCard
            icon={<Music className="w-4 h-4" />}
            title={t('dialog.loudness_normalization')}
            description={t('dialog.loudness_desc')}
            checked={checked}
            onCheckedChange={onChange}
        />
    )
}
