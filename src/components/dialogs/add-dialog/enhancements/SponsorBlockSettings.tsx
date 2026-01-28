import React from 'react'
import { AlertCircle } from 'lucide-react'
import { SettingCard } from '../../../common'

interface SponsorBlockSettingsProps {
    t: (key: string) => string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    disabledReason?: string
}

export const SponsorBlockSettings: React.FC<SponsorBlockSettingsProps> = ({
    t,
    checked,
    onChange,
    disabled,
    disabledReason
}) => {
    return (
        <SettingCard
            icon={<AlertCircle className="w-4 h-4" />}
            title={t('dialog.remove_sponsors')}
            description={t('dialog.remove_sponsors_desc')}
            checked={checked}
            onCheckedChange={onChange}
            disabled={disabled}
            disabledReason={disabledReason}
        />
    )
}
