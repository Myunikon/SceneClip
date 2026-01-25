import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface GpuIndicatorProps {
    gpuType: 'cpu' | 'nvidia' | 'amd' | 'intel' | 'apple'
    hardwareDecoding: boolean
}

export function GpuIndicator({ gpuType, hardwareDecoding }: GpuIndicatorProps) {
    const { t } = useTranslation()

    const vendorLabels: Record<string, string> = {
        'nvidia': t('statusbar.nvidia_gpu'),
        'amd': t('statusbar.amd_gpu'),
        'intel': t('statusbar.intel_gpu'),
        'apple': t('statusbar.apple_gpu'),
        'cpu': t('statusbar.cpu_mode')
    }
    const displayLabel = vendorLabels[gpuType] || 'GPU'

    if (!hardwareDecoding) {
        return (
            <>
                <Zap className="w-3.5 h-3.5 text-muted-foreground/30" />
                <span className="text-muted-foreground/40 font-bold uppercase tracking-tighter">SFW</span>
            </>
        )
    }

    return gpuType !== 'cpu' ? (
        <>
            <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 will-change-transform"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            </span>
            <span className="text-emerald-500 font-bold uppercase tracking-tighter">{displayLabel}</span>
        </>
    ) : (
        <span className="text-muted-foreground/30 font-bold uppercase tracking-tighter">CPU</span>
    )
}
