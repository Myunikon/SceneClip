import { motion } from "framer-motion"
import { ComponentType } from "react"
import { cn } from "../../lib/utils"

interface Option {
    value: string
    label: string
    icon?: ComponentType<{ className?: string }>
}

interface SegmentedControlProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
    className?: string
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
    return (
        <div className={cn("flex p-1 bg-secondary/40 backdrop-blur-md rounded-lg relative border border-black/5 dark:border-white/5", className)}>
            {options.map((opt) => {
                const isActive = value === opt.value
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "relative flex-1 px-4 py-1.5 text-xs font-medium rounded-[6px] transition-all flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 whitespace-nowrap",
                            isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeSegment"
                                className="absolute inset-0 bg-background shadow-sm shadow-black/5 ring-1 ring-black/5 dark:ring-white/5 rounded-[6px]"
                                initial={false}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative flex items-center justify-center gap-2 z-10">
                            {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
                            {opt.label}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
