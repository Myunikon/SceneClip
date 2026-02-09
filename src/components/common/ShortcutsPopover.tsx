import { useRef, useEffect } from 'react'
import { Keyboard, Command, Settings, History, Download, Maximize, Key } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { getShortcutSymbol, getShiftSymbol, getAltSymbol, IS_MAC } from '../../lib/platform'
import { cn } from '../../lib/utils'

interface ShortcutsPopoverProps {
    isOpen: boolean
    onClose: () => void
}

export function ShortcutsPopover({ isOpen, onClose }: ShortcutsPopoverProps) {
    const { t } = useTranslation()
    const popoverRef = useRef<HTMLDivElement>(null)

    // Unified Shortcuts List (No Groups per user request)
    const shortcuts = [
        // Primary Actions
        { keys: [getShortcutSymbol(), 'N'], label: t('downloads.new_download'), icon: Command },

        // Navigation (In Order)
        {
            keys: IS_MAC ? [getShortcutSymbol(), getAltSymbol(), 'L'] : [getShortcutSymbol(), 'J'],
            label: t('nav.downloads'),
            icon: Download
        },
        { keys: [getShortcutSymbol(), 'K'], label: t('nav.keyring') || "Keyring", icon: Key },
        {
            keys: IS_MAC ? [getShortcutSymbol(), getShiftSymbol(), 'H'] : [getShortcutSymbol(), 'H'],
            label: t('history.title'),
            icon: History
        },
        { keys: [getShortcutSymbol(), ','], label: t('nav.settings'), icon: Settings },

        // Window Controls
        { keys: IS_MAC ? ['Fn', 'F'] : ['F11'], label: t('guide.sections.shortcuts_fullscreen'), icon: Maximize },
    ]

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    // Close on Esc
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) document.addEventListener('keydown', handleEsc)
        return () => document.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.95, y: -8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, y: -8, filter: "blur(4px)" }}
                    transition={{
                        opacity: { duration: 0.2 },
                        filter: { duration: 0.2 },
                        default: { type: "spring", stiffness: 260, damping: 20 }
                    }}
                    style={{ transformOrigin: "top right" }}
                    className={cn(
                        "absolute top-14 right-20 z-50 w-72 flex flex-col",
                        "bg-popover/80 backdrop-blur-xl border border-border/50",
                        "rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 bg-white/5">
                        <h3 className="font-semibold text-xs text-foreground/90 flex items-center gap-2">
                            <Keyboard className="w-4 h-4 text-primary" />
                            {t('shortcuts.title')}
                        </h3>
                        <div className="text-[10px] text-muted-foreground font-mono opacity-50">ESC</div>
                    </div>

                    {/* Content */}
                    <div className="p-2 space-y-0.5">
                        {shortcuts.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group cursor-default"
                            >
                                <div className="flex items-center gap-2.5">
                                    <item.icon className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                                    <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                                        {item.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {item.keys.map((key, k) => (
                                        <KeyCap key={k}>{key}</KeyCap>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Apple-style Keycap Component
function KeyCap({ children }: { children: React.ReactNode }) {
    return (
        <div className={cn(
            "min-w-[20px] h-5 flex items-center justify-center px-1.5",
            "text-[10px] font-medium font-mono text-foreground/90",
            "bg-secondary/50 border-b-2 border-border/60 rounded-[4px]", // The key physical look
            "shadow-sm",
            "select-none"
        )}>
            {children}
        </div>
    )
}
