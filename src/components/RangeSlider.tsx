import { useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

interface RangeSliderProps {
    duration: number // in seconds
    start: number
    end: number
    onChange: (start: number, end: number) => void
    disabled?: boolean
}

export function RangeSlider({ duration, start, end, onChange, disabled }: RangeSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null)

    if (duration === 0) return null; // Prevent division by zero / NaN

    // Calculate percentage positions
    // Ensure render safety even if start > end (though logic should prevent it)
    const safeStart = Math.min(start, end)
    const safeEnd = Math.max(start, end)

    const startPct = Math.min(100, Math.max(0, (safeStart / duration) * 100))
    const endPct = Math.min(100, Math.max(0, (safeEnd / duration) * 100))
    
    const handleDrag = (type: 'start' | 'end', info: any) => {
        if (!trackRef.current) return
        const rect = trackRef.current.getBoundingClientRect()
        const x = info.point.x - rect.left
        const pct = Math.min(1, Math.max(0, x / rect.width))
        const val = Math.round(pct * duration)

        if (type === 'start') {
            const newStart = Math.min(val, end - 1) // Prevent crossing
            onChange(newStart, end)
        } else {
            const newEnd = Math.max(val, start + 1) // Prevent crossing
            onChange(start, newEnd)
        }
    }

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = Math.floor(s % 60)
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    return (
        <div className={cn("w-full py-4 select-none", disabled && "opacity-50 pointer-events-none")}>
            <div ref={trackRef} className="h-2 bg-secondary rounded-full relative w-full touch-none">
                {/* Active Range Bar */}
                <div 
                    className="absolute h-full bg-primary/30 rounded-full"
                    style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }}
                />

                {/* Thumb Start */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-primary rounded-full shadow-lg border-2 border-background cursor-grab active:cursor-grabbing z-20 hover:z-30 flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ left: `${startPct}%` }}
                    drag="x"
                    dragConstraints={trackRef}
                    dragElastic={0}
                    dragMomentum={false}
                    onDrag={(_, info) => handleDrag('start', info)}
                >
                    <div className="absolute -top-7 text-[10px] font-mono font-bold bg-foreground text-background px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                        {formatTime(start)}
                    </div>
                </motion.div>

                {/* Thumb End */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-primary rounded-full shadow-lg border-2 border-background cursor-grab active:cursor-grabbing z-20 hover:z-30 flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ left: `${endPct}%` }}
                    drag="x"
                    dragConstraints={trackRef}
                    dragElastic={0}
                    dragMomentum={false}
                    onDrag={(_, info) => handleDrag('end', info)}
                >
                    <div className="absolute -top-7 text-[10px] font-mono font-bold bg-foreground text-background px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                        {formatTime(end)}
                    </div>
                </motion.div>
            </div>
            
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-mono px-1">
                <span>0:00</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    )
}
