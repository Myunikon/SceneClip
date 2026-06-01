import { cn } from "@/lib/utils"

export interface RadioOption<T> {
    value: T
    label: string
    disabled?: boolean
}

export interface RadioGroupProps<T> {
    options: RadioOption<T>[]
    value: T
    onChange: (value: T) => void
    name: string
    disabled?: boolean
    className?: string
}

export function RadioGroup<T extends string | number>({
    options,
    value,
    onChange,
    name,
    disabled = false,
    className
}: RadioGroupProps<T>) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {options.map((option) => {
                const isChecked = option.value === value
                const isDisabled = disabled || option.disabled

                return (
                    <label
                        key={String(option.value)}
                        className={cn(
                            "inline-flex items-center gap-2 select-none cursor-pointer",
                            isDisabled && "cursor-not-allowed opacity-50"
                        )}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={String(option.value)}
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => !isDisabled && onChange(option.value)}
                            className="sr-only"
                        />
                        <div
                            role="radio"
                            aria-checked={isChecked}
                            aria-disabled={isDisabled}
                            tabIndex={isDisabled ? -1 : isChecked ? 0 : -1}
                            className={cn(
                                "h-4 w-4 shrink-0 rounded-full border border-neutral-300 dark:border-white/20 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                isChecked ? "border-primary text-primary" : "bg-white dark:bg-black/20 hover:border-primary/40",
                                isDisabled && "bg-secondary/20 border-neutral-200 dark:border-white/5"
                            )}
                        >
                            {isChecked && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                            {option.label}
                        </span>
                    </label>
                )
            })}
        </div>
    )
}
