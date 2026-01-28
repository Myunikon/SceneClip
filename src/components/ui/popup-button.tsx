import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

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
    const [isOpen, setIsOpen] = useState(false)
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Portal state
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

    // Update coordinates when opening
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setCoords({
                top: rect.bottom + window.scrollY + 4, // 4px gap
                left: align === 'left' ? (rect.left + window.scrollX) : (rect.right + window.scrollX - rect.width),
                width: rect.width
            })
        }
    }, [isOpen, align])

    // Handle Resize & Scroll
    useEffect(() => {
        const handleResize = () => setIsOpen(false)
        const handleScroll = (e: Event) => {
            // If the scroll event originated from within the dropdown list, do not close
            if (listRef.current && (listRef.current === e.target || listRef.current.contains(e.target as Node))) {
                return
            }
            // Close on outside scroll
            setIsOpen(false)
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('scroll', handleScroll, true)

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('scroll', handleScroll, true)
        }
    }, [])

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                listRef.current &&
                !listRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                setFocusedIndex(-1)
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    // Scroll focused item into view
    useEffect(() => {
        if (isOpen && listRef.current && focusedIndex >= 0) {
            const list = listRef.current
            const element = list.children[focusedIndex] as HTMLElement
            if (element) {
                element.scrollIntoView({ block: 'nearest' })
            }
        }
    }, [focusedIndex, isOpen])

    // Reset focused index when opening
    useEffect(() => {
        if (isOpen) {
            const index = options.findIndex(o => o.value === value)
            setFocusedIndex(index >= 0 ? index : 0)
        } else {
            setFocusedIndex(-1)
        }
    }, [isOpen, value, options])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault()
                if (isOpen) {
                    if (focusedIndex >= 0 && focusedIndex < options.length) {
                        onChange(options[focusedIndex].value)
                        setIsOpen(false)
                    }
                } else {
                    setIsOpen(true)
                }
                break
            case 'ArrowDown':
                e.preventDefault()
                if (!isOpen) {
                    setIsOpen(true)
                } else {
                    setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev))
                }
                break
            case 'ArrowUp':
                e.preventDefault()
                if (!isOpen) {
                    setIsOpen(true)
                } else {
                    setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev))
                }
                break
            case 'Escape':
                e.preventDefault()
                setIsOpen(false)
                break
            case 'Tab':
                if (isOpen) setIsOpen(false)
                break
        }
    }

    const selectedOption = options.find(o => o.value === value)
    const displayLabel = selectedOption ? selectedOption.label : (placeholder || "Select...")

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
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

            {isOpen && createPortal(
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
                                    setIsOpen(false)
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
