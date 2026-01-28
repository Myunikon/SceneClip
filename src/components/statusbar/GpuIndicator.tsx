import { Zap, Cpu } from 'lucide-react'
// import { useTranslation } from 'react-i18next'

interface GpuIndicatorProps {
    gpuType: 'cpu' | 'nvidia' | 'amd' | 'intel' | 'apple'
    hardwareDecoding: boolean
}

export function GpuIndicator({ gpuType, hardwareDecoding }: GpuIndicatorProps) {
    // const { t } = useTranslation() // Unused

    // Removed unused vendorLabels and displayLabel since we are now Icon-Only

    if (!hardwareDecoding) {
        return (
            <div className="relative flex items-center justify-center opacity-50">
                <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
        )
    }

    const Icon = hardwareDecoding ? Zap : Cpu // Use Zap (Lightning) for HW Accel, CPU chip for Software

    return gpuType !== 'cpu' ? (
        <div className="relative flex items-center justify-center">
            {/* Breathing Icon */}
            <Icon className="w-3.5 h-3.5 text-emerald-500 animate-pulse duration-[3000ms]" />
            {/* Subtle Glow behind */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-[4px] rounded-full"></div>
        </div>
    ) : (
        <div className="relative flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-muted-foreground/30" />
        </div>
    )
}
