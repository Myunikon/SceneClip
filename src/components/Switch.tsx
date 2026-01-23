import { cn } from '../lib/utils'

interface SwitchProps {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

export function Switch({ checked, onCheckedChange, disabled, className }: SwitchProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onCheckedChange(!checked)
        }
    }

    return (
        <div
            role="switch"
            tabIndex={disabled ? -1 : 0}
            aria-checked={checked}
            aria-disabled={disabled}
            data-state={checked ? 'checked' : 'unchecked'}
            onClick={(e) => {
                e.stopPropagation()
                if (!disabled) onCheckedChange(!checked)
            }}
            onKeyDown={handleKeyDown}
            className={cn(
                "w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 border-2 border-transparent cursor-pointer inline-flex items-center",
                checked
                    ? "bg-orange-500 dark:bg-orange-400"
                    : "bg-secondary",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            <span
                data-state={checked ? 'checked' : 'unchecked'}
                className={cn(
                    "block w-5 h-5 rounded-full bg-white shadow-lg ring-0 transition-transform pointer-events-none",
                    checked ? "translate-x-5" : "translate-x-0"
                )}
            />
        </div>
    )
}
