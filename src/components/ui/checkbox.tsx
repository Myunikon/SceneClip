import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, label, disabled, ...props }, ref) => {
        return (
            <label className={cn("inline-flex items-center gap-2 select-none cursor-pointer", disabled && "cursor-not-allowed opacity-50", className)}>
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => onCheckedChange(e.target.checked)}
                    ref={ref}
                    {...props}
                />
                <div
                    className={cn(
                        "h-4 w-4 shrink-0 rounded border border-neutral-300 dark:border-white/20 transition-all flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50",
                        checked ? "bg-primary border-primary text-primary-foreground" : "bg-white dark:bg-black/20 hover:border-primary/40",
                        disabled && "bg-secondary/20 border-neutral-200 dark:border-white/5"
                    )}
                >
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </div>
                {label && (
                    <span className="text-sm font-medium text-foreground">
                        {label}
                    </span>
                )}
            </label>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
