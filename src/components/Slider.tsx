import { useRef, useState, useEffect } from 'react'
import { cn } from '../lib/utils'

interface SliderProps {
    min: number
    max: number
    step?: number
    value: number
    onChange: (value: number) => void
    disabled?: boolean
    className?: string
}

export function Slider({ min, max, step = 1, value, onChange, disabled, className }: SliderProps) {
    const trackRef = useRef<HTMLDivElement>(null)
    const [dragging, setDragging] = useState(false)

    // Ensure value is within bounds
    const safeValue = Math.min(max, Math.max(min, value))
    const percentage = ((safeValue - min) / (max - min)) * 100

    useEffect(() => {
        if (!dragging) return

        const handlePointerMove = (e: PointerEvent) => {
            if (!trackRef.current) return
            const rect = trackRef.current.getBoundingClientRect()
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
            const pct = x / rect.width

            const rawValue = min + pct * (max - min)
            const steppedValue = Math.round(rawValue / step) * step
            const finalValue = Math.min(max, Math.max(min, steppedValue))

            onChange(finalValue)
        }

        const handlePointerUp = () => {
            setDragging(false)
        }

        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)

        return () => {
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
        }
    }, [dragging, min, max, step, onChange])

    return (
        <div
            className={cn("w-full py-2 select-none touch-none flex items-center h-6", disabled && "opacity-50 pointer-events-none", className)}
            onPointerDown={(e) => {
                if (e.button !== 0) return
                setDragging(true)
                // Trigger immediate update on click
                if (trackRef.current) {
                    const rect = trackRef.current.getBoundingClientRect()
                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
                    const pct = x / rect.width
                    const rawValue = min + pct * (max - min)
                    const steppedValue = Math.round(rawValue / step) * step
                    onChange(Math.min(max, Math.max(min, steppedValue)))
                }
            }}
        >
            <div ref={trackRef} className="h-1.5 bg-secondary/50 dark:bg-zinc-800 rounded-full relative w-full group cursor-pointer">
                {/* Active Track */}
                <div
                    className="absolute h-full bg-primary rounded-full transition-all duration-75"
                    style={{ width: `${percentage}%` }}
                />

                {/* Thumb */}
                <div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-background border-2 border-primary rounded-full shadow-md z-10 transition-transform",
                        dragging ? "scale-110 ring-4 ring-primary/20 cursor-grabbing" : "hover:scale-110 cursor-grab"
                    )}
                    style={{ left: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
