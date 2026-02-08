import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'

interface SwitchProps extends Omit<HTMLMotionProps<"button">, 'onChange' | 'value'> {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    disabled?: boolean
}

export function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
    return (
        <motion.button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-primary" : "bg-input shadow-inner dark:bg-zinc-700/50",
                className
            )}
            whileTap={{ scale: 0.95 }}
            {...props}
        >
            <motion.span
                initial={false}
                animate={{ x: checked ? 20 : 0 }}
                transition={{
                    type: "spring",
                    stiffness: 700,
                    damping: 30
                }}
                className={cn(
                    "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0"
                )}
            />
        </motion.button>
    )
}
