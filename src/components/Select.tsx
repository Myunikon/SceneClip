import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../lib/utils'

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
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedOption = options.find(o => o.value === value)
    const displayLabel = selectedOption ? selectedOption.label : (placeholder || "Select...")

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md border transition-all duration-200 focus:outline-none",
                    // Dark mode friendly styles
                    "bg-secondary/20 hover:bg-secondary/40 border-border/50 hover:border-primary/30",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "ring-2 ring-primary/20 border-primary/50 bg-secondary/40"
                )}
            >
                <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>{displayLabel}</span>
                <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 w-full mt-1 overflow-hidden rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-xl ring-1 ring-black/10"
                    >
                        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value)
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        "relative w-full cursor-default select-none py-2 pl-9 pr-3 text-sm rounded-lg outline-none text-left transition-colors flex items-center",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        option.value === value ? "bg-primary/10 text-primary font-medium" : "text-popover-foreground"
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
