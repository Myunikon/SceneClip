"use client"

import React, { memo } from "react"
import { cn } from "@/lib/utils"

interface AuroraTextProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode
    className?: string
    colors?: string[]
    speed?: number
    stopAfter?: number
    as?: React.ElementType
}

export const AuroraText = memo(
    ({
        children,
        className,
        colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
        speed = 1,
        stopAfter,
        as: Component = "span",
        ...props
    }: AuroraTextProps) => {
        const [isAnimating, setIsAnimating] = React.useState(true)

        React.useEffect(() => {
            if (stopAfter) {
                const timer = setTimeout(() => {
                    setIsAnimating(false)
                }, stopAfter)
                return () => clearTimeout(timer)
            }
        }, [stopAfter])

        const gradientStyle = {
            backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${colors[0]})`,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animationDuration: `${10 / speed}s`,
        }

        return (
            <Component className={cn("relative inline-block", className)} {...props}>
                <span className="opacity-0">{children}</span>
                <span
                    className={cn(
                        "absolute inset-0 bg-clip-text text-transparent select-auto",
                        isAnimating && "animate-aurora"
                    )}
                    style={gradientStyle}
                    aria-hidden="true"
                >
                    {children}
                </span>
            </Component>
        )
    }
)

AuroraText.displayName = "AuroraText"
