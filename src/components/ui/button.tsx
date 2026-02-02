import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                accent: "bg-accent text-accent-foreground hover:bg-accent/80",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    disableRipple?: boolean
    rippleColor?: string
    rippleDuration?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant,
        size,
        asChild = false,
        disableRipple = false,
        rippleColor = "", // Default depends on variant, can be set per instance
        rippleDuration = "600ms",
        onClick,
        children,
        ...props
    }, ref) => {
        const Comp = asChild ? Slot : "button"

        const [buttonRipples, setButtonRipples] = React.useState<Array<{ x: number; y: number; size: number; key: number }>>([])

        const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            if (!disableRipple && !asChild) {
                createRipple(event)
            }
            onClick?.(event)
        }

        const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
            const button = event.currentTarget
            const rect = button.getBoundingClientRect()
            const size = Math.max(rect.width, rect.height)
            const x = event.clientX - rect.left - size / 2
            const y = event.clientY - rect.top - size / 2

            const key = Date.now() + Math.random() // Avoid collision
            const newRipple = { x, y, size, key }
            setButtonRipples((prevRipples) => [...prevRipples, newRipple])

            // Parse duration efficiently
            let durationMs = 600
            if (rippleDuration.endsWith('ms')) {
                durationMs = parseInt(rippleDuration)
            } else if (rippleDuration.endsWith('s')) {
                durationMs = parseFloat(rippleDuration) * 1000
            } else {
                const parsed = parseInt(rippleDuration)
                if (!isNaN(parsed)) durationMs = parsed
            }

            // Each ripple manages its own cleanup timeout independently
            setTimeout(() => {
                setButtonRipples((prevRipples) =>
                    prevRipples.filter((ripple) => ripple.key !== key)
                )
            }, durationMs)
        }



        // CSS variable for color can be improved, but inline style works for now.
        // For dark mode compatibility on ghost/outline, ideally we use 'full' current text color or a css variable.
        // But for this quick implementation, a semi-transparent white or black logic covers 90%. 
        // Better: Use `currentColor` with opacity?
        // Let's use `bg-foreground` with low opacity via class if possible, or stick to this.
        // Actually, `currentColor` is best for ghost/outline.

        const finalRippleColor = rippleColor || (
            (variant === 'default' || variant === 'destructive' || variant === 'accent') ? 'rgba(255, 255, 255, 0.3)' : 'currentColor'
        )

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                onClick={handleClick}
                {...props}
            >
                {children}
                {!asChild && !disableRipple && (
                    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                        {buttonRipples.map((ripple) => (
                            <span
                                className="absolute animate-rippling rounded-full opacity-30 bg-foreground"
                                key={ripple.key}
                                style={{
                                    width: `${ripple.size}px`,
                                    height: `${ripple.size}px`,
                                    top: `${ripple.y}px`,
                                    left: `${ripple.x}px`,
                                    backgroundColor: finalRippleColor === 'currentColor' ? undefined : finalRippleColor, // If currentColor, let class handle it (bg-foreground is close enough or we use inline)
                                    transform: `scale(0)`,
                                    animationDuration: rippleDuration,
                                }}
                            />
                        ))}
                    </span>
                )}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
