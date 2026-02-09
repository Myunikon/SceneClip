import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Switch } from '../ui'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

// --- 1. BASE CARD COMPONENT ---
interface OptionCardProps {
    icon?: React.ReactNode
    title: string
    description?: string | React.ReactNode
    activeColor?: 'red' | 'orange' | 'purple' | 'emerald' | 'blue' | 'neutral'
    disabled?: boolean
    disabledReason?: string
    children?: React.ReactNode
    onClick?: () => void
    className?: string
}

export function OptionCard({
    icon, title, description, activeColor = 'neutral', disabled = false, disabledReason,
    children, onClick, className
}: OptionCardProps) {
    const colorClasses = {
        red: "bg-red-500/5 border-red-500/20",
        orange: "bg-orange-500/5 border-orange-500/20",
        purple: "bg-purple-500/5 border-purple-500/20",
        emerald: "bg-emerald-500/5 border-emerald-500/20",
        blue: "bg-primary/5 border-primary/20",
        neutral: "bg-secondary/30 border-border"
    }

    return (
        <div className={cn(
            "flex flex-col gap-0 border rounded-xl bg-transparent overflow-hidden transition-all",
            disabled ? "opacity-50 border-dashed border-border/50" : cn("border-border", colorClasses[activeColor]),
            className
        )}>
            <div
                onClick={() => !disabled && onClick?.()}
                className={cn(
                    "flex items-center p-2.5 transition-all min-h-[48px] gap-3",
                    disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-secondary/40"
                )}
            >
                {icon && (
                    <div className={cn("p-1.5 rounded-lg shrink-0 bg-secondary/80 dark:bg-white/10 text-muted-foreground")}>
                        {icon}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="font-bold text-[0.93rem] leading-none truncate">{title}</div>
                    {description && (
                        <div className="text-xs text-muted-foreground mt-1 opacity-80 break-words line-clamp-1">
                            {disabled && disabledReason ? disabledReason : description}
                        </div>
                    )}
                </div>
            </div>
            {children && (
                <div className="px-3 pb-3">
                    {children}
                </div>
            )}
        </div>
    )
}

// --- 2. SETTING CARD (TOGGLE) ---
interface SettingCardProps extends Omit<OptionCardProps, 'children'> {
    checked: boolean
    onCheckedChange: (val: boolean) => void
    expandableContent?: React.ReactNode
}

export function SettingCard({
    icon, title, description, checked, onCheckedChange,
    activeColor = 'neutral', disabled, disabledReason, expandableContent, onClick, className
}: SettingCardProps) {
    const colorClasses = {
        red: checked ? "bg-red-500/10 border-red-500/30" : "bg-transparent border-border",
        orange: checked ? "bg-orange-500/10 border-orange-500/30" : "bg-transparent border-border",
        purple: checked ? "bg-purple-500/20 border-purple-500/50" : "bg-transparent border-border",
        emerald: checked ? "bg-emerald-500/10 border-emerald-500/30" : "bg-transparent border-border",
        blue: checked ? "bg-primary/10 border-primary/30" : "bg-transparent border-border",
        neutral: checked ? "bg-secondary/50 border-border/60 dark:border-white/10" : "bg-transparent border-border"
    }

    const iconBgClasses = {
        red: checked ? "bg-red-500 text-white" : "bg-white/10 text-muted-foreground",
        orange: checked ? "bg-orange-500 text-white" : "bg-white/10 text-muted-foreground",
        purple: checked ? "bg-purple-500 text-white" : "bg-white/10 text-muted-foreground",
        emerald: checked ? "bg-emerald-500 text-white" : "bg-white/10 text-muted-foreground",
        blue: checked ? "bg-primary text-white" : "bg-secondary/80 dark:bg-white/10 text-muted-foreground",
        neutral: checked ? "bg-white dark:bg-white/90 text-black" : "bg-secondary/80 dark:bg-white/10 text-muted-foreground"
    }

    const switchClasses = {
        red: "data-[state=checked]:bg-red-500",
        orange: "data-[state=checked]:bg-orange-500",
        purple: "data-[state=checked]:bg-purple-500",
        emerald: "data-[state=checked]:bg-emerald-500",
        blue: "data-[state=checked]:bg-primary",
        neutral: "data-[state=checked]:bg-white"
    }

    return (
        <div className={cn("flex flex-col gap-0 border rounded-xl bg-transparent overflow-hidden transition-all", colorClasses[activeColor], className)}>
            <div
                onClick={() => !disabled && (onClick ? onClick() : onCheckedChange(!checked))}
                className={cn(
                    "flex items-center justify-between p-2.5 transition-all min-h-[50px]",
                    disabled ? "opacity-50 cursor-not-allowed border-dashed" : "cursor-pointer hover:bg-secondary/40"
                )}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("p-1.5 rounded-lg shrink-0", iconBgClasses[activeColor])}>
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-[0.93rem] leading-none truncate">{title}</div>
                        {description && (
                            <div className="text-xs text-muted-foreground mt-0.5 opacity-80 truncate">
                                {disabled && disabledReason ? disabledReason : description}
                            </div>
                        )}
                    </div>
                </div>
                <div onClick={e => e.stopPropagation()}>
                    <Switch
                        checked={checked}
                        onCheckedChange={onCheckedChange}
                        disabled={disabled}
                        className={cn(switchClasses[activeColor], "scale-90 shrink-0 ml-2")}
                    />
                </div>
            </div>
            <AnimatePresence>
                {checked && expandableContent && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/5 dark:bg-black/20 border-t border-border"
                    >
                        {expandableContent}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// --- 3. CHOICE GROUP COMPONENT ---
interface ChoiceGroupProps<T> {
    options: { value: T; label: string | React.ReactNode; icon?: React.ElementType; desc?: string; recommended?: boolean; disabled?: boolean; title?: string }[]
    value: T
    onChange: (val: T) => void
    columns?: number
    activeColor?: 'primary' | 'orange' | 'red' | 'purple' | 'emerald'
    variant?: 'grid' | 'scroll' | 'segment' | 'wrap'
}

export function ChoiceGroup<T extends string | number | undefined>({
    options, value, onChange, columns = 2, activeColor = 'primary', variant = 'grid'
}: ChoiceGroupProps<T>) {

    const activeClasses = {
        primary: "text-primary ring-primary/50",
        orange: "text-orange-400 ring-orange-500/50",
        red: "text-red-400 ring-red-500/50",
        purple: "text-purple-300 ring-purple-500/50",
        emerald: "text-emerald-400 ring-emerald-500/50"
    }



    const gridClasses = columns === 4 ? "grid-cols-4" : columns === 3 ? "grid-cols-3" : "grid-cols-2"

    // VARIANT SEGMENT: Native Apple Style (Sliding Pill)
    if (variant === 'segment') {
        return (
            <div className="flex p-1 bg-secondary/80 rounded-lg gap-1 border border-transparent">
                {options.map((opt) => {
                    const isSelected = value === opt.value
                    const Icon = opt.icon

                    return (
                        <button
                            key={String(opt.value)}
                            type="button"
                            onClick={() => !opt.disabled && onChange(opt.value)}
                            disabled={opt.disabled}
                            className={cn(
                                "relative flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[13px] font-medium transition-all z-0",
                                isSelected ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
                                opt.disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isSelected && (
                                <motion.div
                                    layoutId="segment-active"
                                    className="absolute inset-0 bg-background rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.1)] z-[-1] border border-black/5"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            {Icon && <Icon className="w-3.5 h-3.5" />}
                            <span>{opt.label}</span>
                        </button>
                    )
                })}
            </div>
        )
    }

    // Default GRID, SCROLL, & WRAP Variants
    return (
        <div className={cn(
            variant === 'grid' ? cn("grid gap-2", gridClasses) :
                variant === 'wrap' ? "flex flex-wrap gap-2" :
                    "flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
        )}>
            {options.map((opt) => {
                const isSelected = value === opt.value
                const Icon = opt.icon

                return (
                    <TooltipProvider key={String(opt.value)} delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => !opt.disabled && onChange(opt.value)}
                                    disabled={opt.disabled}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all text-center",
                                        variant === 'scroll' || variant === 'wrap' ? "flex-none min-w-[5rem]" : "min-h-[42px]",
                                        isSelected
                                            ? cn("bg-primary text-primary-foreground shadow-md ring-0", activeClasses[activeColor].replace('text-', 'text-primary-foreground ring-0')) // Active: Solid Color
                                            : opt.disabled
                                                ? "opacity-40 cursor-not-allowed bg-secondary/30 text-muted-foreground border-transparent border-dashed"
                                                : "bg-card hover:bg-secondary/50 border-transparent shadow-sm text-foreground", // Inactive: White Card
                                        opt.desc ? "py-2" : ""
                                    )}
                                >
                                    {isSelected && !opt.desc && variant === 'grid' && (
                                        <div className="hidden" />
                                    )}

                                    {Icon && (
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mb-1",
                                            isSelected ? "bg-white/20 dark:bg-white/10" : "bg-black/5 dark:bg-white/5"
                                        )}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    )}

                                    <div className={cn("font-bold text-xs leading-tight")}>
                                        {opt.label}
                                    </div>

                                    {opt.desc && (
                                        <div className="text-[10px] text-muted-foreground font-medium opacity-80 mt-0.5">
                                            {opt.desc}
                                        </div>
                                    )}

                                    {opt.recommended && (
                                        <div className="absolute -top-1 -right-1">
                                            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                        </div>
                                    )}
                                </button>
                            </TooltipTrigger>
                            {opt.title && (
                                <TooltipContent>
                                    <p>{opt.title}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                )
            })}
        </div>
    )
}

import { Star } from 'lucide-react'
