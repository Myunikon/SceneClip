import { useRef, useState, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface RangeSliderProps {
    duration: number // in seconds
    start: number
    end: number
    onChange: (start: number, end: number) => void
    disabled?: boolean
}

export function RangeSlider({ duration, start, end, onChange, disabled }: RangeSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [dragging, setDragging] = useState<'start' | 'end' | null>(null)

    // Use refs for values needed in event handlers to avoid re-binding listeners
    const stateRef = useRef({ duration, start, end, onChange })
    useEffect(() => {
        stateRef.current = { duration, start, end, onChange }
    }, [duration, start, end, onChange])

    // Calculate percentage positions
    const safeStart = Math.min(start, end)
    const safeEnd = Math.max(start, end)

    const startPct = duration > 0 ? Math.min(100, Math.max(0, (safeStart / duration) * 100)) : 0
    const endPct = duration > 0 ? Math.min(100, Math.max(0, (safeEnd / duration) * 100)) : 100


    // Fix: Redesigned Drag Logic to avoid repeated addEventListener
    useEffect(() => {
        if (!dragging) return

        const onMove = (e: PointerEvent) => {
            if (!trackRef.current) return
            const { duration, start, end, onChange } = stateRef.current

            const rect = trackRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const pct = Math.min(1, Math.max(0, x / rect.width))
            const val = Math.round(pct * duration)
            const safeE = Math.max(start, end)
            const safeS = Math.min(start, end)

            if (dragging === 'start') {
                // Prevent crossing
                const newStart = Math.min(val, safeE - 1)
                onChange(Math.min(newStart, safeE), safeE)
            } else {
                const newEnd = Math.max(val, safeS + 1)
                onChange(safeS, Math.max(newEnd, safeS))
            }
        }

        const onUp = () => setDragging(null)

        window.addEventListener('pointermove', onMove, { passive: true }) // Performance fix
        window.addEventListener('pointerup', onUp)

        return () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
        }
    }, [dragging]) // Only re-bind when drag state changes (start/stop)

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = Math.floor(s % 60)
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    return (
        <div className={cn("w-full py-6 select-none relative", disabled && "opacity-50 pointer-events-none")}>
            <div ref={trackRef} className="h-1.5 bg-secondary/50 dark:bg-white/10 rounded-full relative w-full touch-none hover:bg-secondary/80 transition-colors">
                {/* Active Range Bar */}
                <div
                    className="absolute h-full bg-primary rounded-full opacity-80"
                    style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }}
                />

                {/* Thumb Start */}
                <div
                    role="slider"
                    aria-label="Start Time"
                    aria-valuemin={0}
                    aria-valuemax={safeEnd}
                    aria-valuenow={safeStart}
                    tabIndex={disabled ? -1 : 0}
                    className={cn(
                        "group absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-background border-2 border-primary rounded-full shadow-lg cursor-grab active:cursor-grabbing z-20 flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        dragging === 'start' && "scale-110 ring-4 ring-primary/20"
                    )}
                    style={{ left: `${startPct}%` }}
                    onPointerDown={(e) => {
                        e.preventDefault()
                        setDragging('start')
                    }}
                    onKeyDown={(e) => {
                        if (disabled) return
                        if (e.key === 'ArrowRight') onChange(Math.min(safeStart + 1, safeEnd - 1), safeEnd)
                        if (e.key === 'ArrowLeft') onChange(Math.max(0, safeStart - 1), safeEnd)
                    }}
                >
                    <div className={cn(
                        "absolute -top-8 text-[10px] font-mono font-bold bg-foreground text-background px-2 py-1 rounded-md shadow-lg whitespace-nowrap transition-all pointer-events-none",
                        dragging === 'start' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-100"
                    )}>
                        {formatTime(start)}
                    </div>
                </div>

                {/* Thumb End */}
                <div
                    role="slider"
                    aria-label="End Time"
                    aria-valuemin={safeStart}
                    aria-valuemax={duration}
                    aria-valuenow={safeEnd}
                    tabIndex={disabled ? -1 : 0}
                    className={cn(
                        "group absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-background border-2 border-primary rounded-full shadow-lg cursor-grab active:cursor-grabbing z-20 flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        dragging === 'end' && "scale-110 ring-4 ring-primary/20"
                    )}
                    style={{ left: `${endPct}%` }}
                    onPointerDown={(e) => {
                        e.preventDefault()
                        setDragging('end')
                    }}
                    onKeyDown={(e) => {
                        if (disabled) return
                        if (e.key === 'ArrowRight') onChange(safeStart, Math.min(duration, safeEnd + 1))
                        if (e.key === 'ArrowLeft') onChange(safeStart, Math.max(safeStart + 1, safeEnd - 1))
                    }}
                >
                    <div className={cn(
                        "absolute -top-8 text-[10px] font-mono font-bold bg-foreground text-background px-2 py-1 rounded-md shadow-lg whitespace-nowrap transition-all pointer-events-none",
                        dragging === 'end' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-100"
                    )}>
                        {formatTime(end)}
                    </div>
                </div>
            </div>
        </div>
    )
}
