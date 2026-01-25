import { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
}

export function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "group w-11 h-6 p-0.5 rounded-full flex items-center transition-colors cursor-pointer border-2 border-transparent",

                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",

                checked
                    ? "bg-orange-500"
                    : "bg-zinc-200 dark:bg-zinc-700/50 shadow-inner",

                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            {...props}
        >
            <span
                style={{ transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
                className={cn(
                    "block h-5 w-5 rounded-full bg-white shadow-sm ring-0 pointer-events-none transition-all duration-300", // Spring-like feel

                    // Checked State:
                    // translate-x-5 = 1.25rem. Matches (w-11 [2.75rem] - w-5 [1.25rem] - p-0.5*2 [0.25rem])
                    checked ? "translate-x-5 shadow-lg" : "translate-x-0 shadow-sm"
                )}
            />
        </button>
    )
}