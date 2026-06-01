import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
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
    isLoading?: boolean
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
        isLoading = false,
        onClick,
        children,
        disabled,
        ...props
    }, ref) => {
        const Comp = asChild ? Slot : "button"
        const [buttonRipples, setButtonRipples] = React.useState<Array<{ x: number; y: number; size: number; key: number }>>([])

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
            const sizeValue = Math.max(rect.width, rect.height)
            const x = event.clientX - rect.left - sizeValue / 2
            const y = event.clientY - rect.top - sizeValue / 2
            const key = Date.now() + Math.random()

            setButtonRipples((prev) => [...prev, { x, y, size: sizeValue, key }])

            setTimeout(() => {
                setButtonRipples((prev) => prev.filter((ripple) => ripple.key !== key))
            }, durationMs)
        }

        const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            if (isLoading || disabled) {
                event.preventDefault()
                return
            }
            if (!disableRipple && !asChild) {
                createRipple(event)
            }
            onClick?.(event)
        }

        const isSolid = variant === 'default' || variant === 'destructive' || variant === 'accent' || variant === 'secondary'
        const defaultRippleColor = isSolid ? 'rgba(255, 255, 255, 0.2)' : 'currentColor'
        const finalRippleColor = rippleColor || defaultRippleColor

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                onClick={handleClick}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {children}
                    </span>
                ) : (
                    children
                )}
                {!asChild && !disableRipple && !disabled && !isLoading && (
                    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                        {buttonRipples.map((ripple) => (
                            <span
                                className={cn(
                                    "absolute animate-rippling rounded-full bg-foreground",
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
