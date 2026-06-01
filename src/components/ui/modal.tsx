import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    className?: string
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
    headerBg?: string
    headerIcon?: React.ReactNode
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    className,
    maxWidth = "md",
    headerBg,
    headerIcon
}: ModalProps) {
    const modalRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose()
                return
            }

            if (e.key === "Tab" && isOpen && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
                )
                const firstElement = focusableElements[0] as HTMLElement
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

                if (focusableElements.length === 0) {
                    e.preventDefault()
                    return
                }

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus()
                        e.preventDefault()
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus()
                        e.preventDefault()
                    }
                }
            }
        }

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown)
            document.body.style.overflow = "hidden"

            // Auto-focus the modal or first interactive child
            setTimeout(() => {
                if (modalRef.current) {
                    const focusableElements = modalRef.current.querySelectorAll(
                        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
                    )
                    if (focusableElements.length > 0) {
                        (focusableElements[0] as HTMLElement).focus()
                    } else {
                        modalRef.current.focus()
                    }
                }
            }, 50)
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = ""
        }
    }, [isOpen, onClose])

    if (typeof document === 'undefined') return null

    const maxWidthClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
    }

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 supports-[backdrop-filter]:bg-black/70 supports-[backdrop-filter]:backdrop-blur-sm"
                    />

                    {/* Dialog Container */}
                    <motion.div
                        ref={modalRef}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? "modal-title" : undefined}
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(
                            "bg-card border border-border w-full rounded-2xl shadow-2xl relative z-[9001] overflow-hidden flex flex-col max-h-[90vh] focus:outline-none",
                            maxWidthClasses[maxWidth],
                            className
                        )}
                    >
                        {/* Header */}
                        {title && (
                            <div className={cn("flex items-center justify-between p-4 border-b border-border", headerBg)}>
                                <div className="flex items-center gap-3">
                                    {headerIcon}
                                    <h3 id="modal-title" className="font-bold text-lg leading-tight text-foreground">{title}</h3>
                                </div>
                                <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
