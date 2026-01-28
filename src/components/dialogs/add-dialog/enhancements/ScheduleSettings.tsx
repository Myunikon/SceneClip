import React from 'react'
import { Calendar, Clock } from 'lucide-react'
import { SettingCard } from '../../../common'
import { CustomDateTimePicker } from '../../../common'

interface ScheduleSettingsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    scheduleTime: string
    onScheduleTimeChange: (date: string) => void
}

export const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({
    t,
    checked,
    onCheckedChange,
    scheduleTime,
    onScheduleTimeChange
}) => {
    return (
        <SettingCard
            icon={<Calendar className="w-4 h-4" />}
            title={t('dialog.schedule_download')}
            description={t('dialog.schedule_desc')}
            checked={checked}
            onCheckedChange={onCheckedChange}
            expandableContent={
                <div className="p-3 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                        <Clock className="w-3 h-3" /> {t('dialog.schedule_time')}
                    </div>
                    <CustomDateTimePicker
                        value={scheduleTime}
                        onChange={onScheduleTimeChange}
                        t={t}
                    />
                </div>
            }
        />
    )
}
