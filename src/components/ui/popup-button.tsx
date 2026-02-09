import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useDropdown } from '../../hooks/useDropdown'

interface Option {
    value: string
    label: string
}

interface PopUpButtonProps {
    value: string
    onChange: (value: string) => void
    options: Option[]
    placeholder?: string
    className?: string
    disabled?: boolean
    align?: 'left' | 'right'
}

export function PopUpButton({ value, onChange, options, placeholder, className, disabled, align = 'left' }: PopUpButtonProps) {
    const { isOpen, toggle, close, containerRef, listRef, coords, focusedIndex, setFocusedIndex } = useDropdown({ align })

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
                    "w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-md shadow-sm border focus:outline-none transition-all",
                    // MacOS Button Style: White/Gradient with subtle border
                    "bg-gradient-to-b from-white to-neutral-50 border-neutral-300 text-neutral-900 shadow-sm", // Light mode
                    "dark:from-white/10 dark:to-white/5 dark:border-white/10 dark:text-white dark:shadow-none", // Dark mode

                    // Hover
                    "hover:from-neutral-50 hover:to-neutral-100 dark:hover:from-white/15 dark:hover:to-white/5 dark:hover:border-white/20",

                    // Active/Open
                    isOpen && "ring-2 ring-primary/30 border-primary/50",

                    disabled && "opacity-50 cursor-not-allowed grayscale",
                    className
                )}
            >
                <span className="truncate pr-2 font-medium">{displayLabel}</span>
                <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
            </button>

            {isOpen && coords && createPortal(
                <div
                    ref={listRef}
                    className="fixed z-[9999] mt-1 overflow-hidden rounded-lg border border-border/50 bg-popover/95 backdrop-blur-xl shadow-xl animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        maxHeight: '300px'
                    }}
                >
                    <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
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
                                    "relative w-full cursor-default select-none py-1.5 pl-8 pr-3 text-sm rounded-md outline-none text-left flex items-center transition-colors",
                                    index === focusedIndex ? "bg-primary text-primary-foreground" : "text-popover-foreground hover:bg-secondary",
                                    option.value === value && index !== focusedIndex ? "font-semibold" : ""
                                )}
                            >
                                {option.value === value && (
                                    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
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
