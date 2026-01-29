import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface SettingSectionProps {
    title: ReactNode
    icon?: ReactNode
    children: ReactNode
    className?: string
    description?: string
}

export function SettingSection({ title, icon, children, className, description }: SettingSectionProps) {
    return (
        <section className={cn("p-5 border rounded-xl bg-card/30 space-y-4", className)}>
            <div className="space-y-1">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    {icon && <span className="text-primary">{icon}</span>}
                    {title}
                </h3>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </section>
    )
}

interface SettingItemProps {
    title: string
    description?: ReactNode
    children: ReactNode
    icon?: ReactNode
    align?: 'center' | 'start' | 'end'
    layout?: 'horizontal' | 'vertical'
    className?: string
    border?: boolean
}

export function SettingItem({
    title,
    description,
    children,
    icon,
    align = 'center',
    layout = 'horizontal',
    className,
    border = false
}: SettingItemProps) {
    if (layout === 'vertical') {
        return (
            <div className={cn("space-y-2", className)}>
                <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                    {icon && <span className="opacity-70">{icon}</span>}
                    {title}
                </label>
                {children}
                {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
            </div>
        )
    }

    return (
        <div className={cn(
            "flex items-center justify-between gap-4 p-2 rounded-lg transition-colors",
            border && "border-t border-border/50 pt-4 mt-2",
            className
        )}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {icon && <div className="p-1.5 rounded-lg bg-secondary/50 text-muted-foreground shrink-0">{icon}</div>}
                <div className="space-y-0.5 min-w-0">
                    <span className="text-sm font-medium block truncate">{title}</span>
                    {description && <div className="text-xs text-muted-foreground leading-relaxed">{description}</div>}
                </div>
            </div>
            <div className={cn(
                "shrink-0",
                align === 'start' && "self-start",
                align === 'end' && "self-end",
                align === 'center' && "self-center"
            )}>
                {children}
            </div>
        </div>
    )
}
