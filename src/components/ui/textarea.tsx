import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, disabled, ...props }, ref) => {
        return (
            <textarea
                disabled={disabled}
                className={cn(
                    "w-full p-3 rounded-xl bg-white dark:bg-black/20 border border-border/60 focus:bg-background focus:border-primary/40 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/30 resize-none font-mono leading-relaxed shadow-sm",
                    error && "border-destructive/60 focus:border-destructive/80 focus:ring-destructive/5",
                    disabled && "opacity-50 cursor-not-allowed bg-secondary/20",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
