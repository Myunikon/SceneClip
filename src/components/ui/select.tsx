import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useDropdown } from '../../hooks/useDropdown'

interface Option {
    value: string
    label: string
}

interface SelectProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function Select({ value, onChange, options, placeholder, className, disabled }: SelectProps) {
    const { isOpen, toggle, close, containerRef, listRef, coords, focusedIndex, setFocusedIndex } = useDropdown()

    // Scroll focused item into view
    useEffect(() => {
        if (isOpen && listRef.current && focusedIndex >= 0) {
            const list = listRef.current
            const element = list.children[focusedIndex] as HTMLElement
            if (element) {
                element.scrollIntoView({ block: 'nearest' })
            }
        }
    }, [focusedIndex, isOpen, listRef])

    // Reset focused index when opening based on current value
    useEffect(() => {
        if (isOpen) {
            const index = options.findIndex(o => o.value === value)
            setFocusedIndex(index >= 0 ? index : 0)
        }
    }, [isOpen, value, options, setFocusedIndex])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault()
                if (isOpen) {
                    if (focusedIndex >= 0 && focusedIndex < options.length) {
                        onChange(options[focusedIndex].value)
                        close()
                    }
                } else {
                    toggle()
                }
                break
            case 'ArrowDown':
                e.preventDefault()
                if (!isOpen) {
                    toggle()
                } else {
                    setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev))
                }
                break
            case 'ArrowUp':
                e.preventDefault()
                if (!isOpen) {
                    toggle()
                } else {
                    setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev))
                }
                break
            case 'Escape':
                e.preventDefault()
                close()
                break
            case 'Tab':
                if (isOpen) close()
                break
        }
    }

    const selectedOption = options.find(o => o.value === value)
    const displayLabel = selectedOption ? selectedOption.label : (placeholder || "Select...")

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && toggle()}
                onKeyDown={handleKeyDown}
                className={cn(
                    "w-full flex items-center justify-between px-3 h-10 text-sm rounded-lg border focus:outline-none transition-all focus:ring-2 focus:ring-primary/50",
                    "bg-white hover:bg-secondary/40 border-neutral-300 dark:border-white/10 hover:border-primary/30",
                    "dark:bg-secondary/50 dark:hover:bg-secondary/70 dark:border-white/10",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "ring-2 ring-primary/20 border-primary/50 bg-secondary/40 dark:bg-secondary/80",
                    className
                )}
            >
                <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>{displayLabel}</span>
                <ChevronDown className={cn("w-4 h-4 opacity-50", isOpen && "rotate-180")} strokeWidth={1.5} />
            </button>

            {isOpen && coords && createPortal(
                <div
                    ref={listRef}
                    className="fixed z-[9999] mt-1 overflow-hidden rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-xl animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        maxHeight: '260px'
                    }}
                >
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {options.map((option, index) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value)
                                    close()
                                }}
                                onMouseEnter={() => setFocusedIndex(index)}
                                className={cn(
                                    "relative w-full cursor-default select-none py-2 pl-9 pr-3 text-sm rounded-lg outline-none text-left flex items-center transition-colors",
                                    index === focusedIndex ? "bg-accent text-accent-foreground" : "text-popover-foreground",
                                    option.value === value ? "font-medium" : ""
                                )}
                            >
                                {option.value === value && (
                                    <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
                                        <Check className="h-4 w-4" />
                                    </span>
                                )}
                                <span className="block truncate">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
