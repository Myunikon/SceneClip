import { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
    icon: ReactNode
    title: string
    description?: ReactNode
    action?: ReactNode
    className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("h-full w-full flex flex-col items-center justify-center p-6 bg-transparent text-center select-none overflow-hidden relative", className)}>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                    duration: 0.4,
                    ease: [0.23, 1, 0.32, 1], // Quart ease-out
                    delay: 0.1
                }}
                className="relative z-10 flex flex-col items-center max-w-sm"
            >
                {/* Icon wrapper */}
                <div className="mb-6 p-4 rounded-3xl bg-gradient-to-br from-secondary/50 to-secondary/10 border border-white/5 shadow-inner flex items-center justify-center text-primary/80">
                    {icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-foreground tracking-tight drop-shadow-sm mb-3">
                    {title}
                </h3>

                {/* Description */}
                {description && (
                    <div className="text-sm text-muted-foreground/60 leading-relaxed mb-6">
                        {description}
                    </div>
                )}

                {/* Action button */}
                {action && (
                    <div className="flex justify-center">
                        {action}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
