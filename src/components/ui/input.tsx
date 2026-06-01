import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
    suffix?: React.ReactNode
    error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", icon, suffix, error, disabled, ...props }, ref) => {
        return (
            <div className="relative w-full group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-colors group-focus-within:text-primary/60 pointer-events-none flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    disabled={disabled}
                    className={cn(
                        "w-full h-10 rounded-lg bg-white dark:bg-black/20 border border-border/60 focus:bg-background focus:border-primary/40 text-[13px] font-sans font-medium outline-none transition-all duration-300 placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/5 shadow-sm",
                        icon ? "pl-10" : "pl-3",
                        suffix ? "pr-10" : "pr-3",
                        error && "border-destructive/60 focus:border-destructive/80 focus:ring-destructive/5",
                        disabled && "opacity-50 cursor-not-allowed bg-secondary/20",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {suffix && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-colors pointer-events-none flex items-center justify-center">
                        {suffix}
                    </div>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
