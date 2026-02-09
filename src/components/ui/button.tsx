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
        rippleColor,
        rippleDuration = "600ms",
        onClick,
        children,
        ...props
    }, ref) => {
        const Comp = asChild ? Slot : "button"
        const [buttonRipples, setButtonRipples] = React.useState<Array<{ x: number; y: number; size: number; key: number }>>([])

        // Fix: Memory Leak & Cleanup Logic
        React.useEffect(() => {
            return () => setButtonRipples([])
        }, [])

        const parseDuration = (val: string) => {
            if (val.endsWith('ms')) return parseInt(val)
            if (val.endsWith('s')) return parseFloat(val) * 1000
            return parseInt(val) || 600
        }
        const durationMs = parseDuration(rippleDuration)

        const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
            const button = event.currentTarget
            const rect = button.getBoundingClientRect()
            const size = Math.max(rect.width, rect.height)
            const x = event.clientX - rect.left - size / 2
            const y = event.clientY - rect.top - size / 2
            const key = Date.now() + Math.random()

            setButtonRipples((prev) => [...prev, { x, y, size, key }])

            // Self-cleaning timeout, but component unmount is handled by useEffect above
            setTimeout(() => {
                setButtonRipples((prev) => prev.filter((ripple) => ripple.key !== key))
            }, durationMs)
        }

        const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            if (!disableRipple && !asChild) {
                createRipple(event)
            }
            onClick?.(event)
        }

        // Logic simplification for ripple color
        const isSolid = variant === 'default' || variant === 'destructive' || variant === 'accent' || variant === 'secondary'
        const defaultRippleColor = isSolid ? 'rgba(255, 255, 255, 0.2)' : 'currentColor'
        const finalRippleColor = rippleColor || defaultRippleColor

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
                                className={cn(
                                    "absolute animate-rippling rounded-full bg-foreground",
                                    // Use class for opacity/color defaults if not overridden inline
                                    finalRippleColor === 'currentColor' && "opacity-20"
                                )}
                                key={ripple.key}
                                style={{
                                    width: `${ripple.size}px`,
                                    height: `${ripple.size}px`,
                                    top: `${ripple.y}px`,
                                    left: `${ripple.x}px`,
                                    transform: `scale(0)`,
                                    animationDuration: rippleDuration,
                                    // Only apply inline if not currentColor to avoid overriding class utility
                                    backgroundColor: finalRippleColor !== 'currentColor' ? finalRippleColor : undefined
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
