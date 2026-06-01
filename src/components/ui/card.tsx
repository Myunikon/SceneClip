import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "solid" | "glass" | "outline"
    interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "solid", interactive = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-xl overflow-hidden flex flex-col transition-all duration-200",
                    variant === "solid" && "bg-card border border-border shadow-sm",
                    variant === "glass" && "glass-panel",
                    variant === "outline" && "border border-border bg-transparent",
                    interactive && "hover:shadow-md hover:scale-[1.002] cursor-pointer",
                    className
                )}
                {...props}
            />
        )
    }
)
Card.displayName = "Card"

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex flex-col space-y-1.5 p-4 border-b border-border/50", className)}
            {...props}
        />
    )
)
CardHeader.displayName = "CardHeader"

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn("font-semibold text-base leading-none tracking-tight", className)}
            {...props}
        />
    )
)
CardTitle.displayName = "CardTitle"

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("text-xs text-muted-foreground", className)}
            {...props}
        />
    )
)
CardDescription.displayName = "CardDescription"

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("p-4 flex-1", className)} {...props} />
    )
)
CardContent.displayName = "CardContent"

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex items-center p-4 pt-0", className)}
            {...props}
        />
    )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
