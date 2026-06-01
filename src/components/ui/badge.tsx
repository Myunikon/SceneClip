import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap select-none",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
                outline: "text-foreground border border-border",
                success:
                    "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500",
                warning:
                    "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500",
                info:
                    "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500",
                purple:
                    "border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500",
                paused:
                    "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
