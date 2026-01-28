import { useEffect, useState } from "react"
import { MotionProps } from "framer-motion"

import { cn } from "@/lib/utils"

interface TypingAnimationProps extends MotionProps {
    children?: string
    className?: string
    duration?: number
    delay?: number
    as?: React.ElementType
    onComplete?: () => void
}

export function TypingAnimation({
    children = "Typing Animation",
    className,
    duration = 100,
    delay = 0,
    as: Component = "span",
    onComplete,
    ...props
}: TypingAnimationProps) {
    const [displayedText, setDisplayedText] = useState<string>("")
    const [started, setStarted] = useState(false)

    useEffect(() => {
        const startTimeout = setTimeout(() => {
            setStarted(true)
        }, delay)
        return () => clearTimeout(startTimeout)
    }, [delay])

    useEffect(() => {
        if (!started) return

        let i = 0
        const typingEffect = setInterval(() => {
            if (i < children.length) {
                setDisplayedText(children.substring(0, i + 1))
                i++
            } else {
                clearInterval(typingEffect)
                if (onComplete) {
                    onComplete()
                }
            }
        }, duration)

        return () => {
            clearInterval(typingEffect)
        }
    }, [children, duration, started])

    return (
        <Component
            className={cn(
                "font-display tracking-[-0.02em] drop-shadow-sm",
                className
            )}
            {...props}
        >
            {displayedText}
        </Component>
    )
}
