import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface ContextMenuProps {
    x: number
    y: number
    visible: boolean
    onClose: () => void
}

export function ContextMenu({ x, y, visible, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [hasSelection, setHasSelection] = useState(false)
    const [canPaste, setCanPaste] = useState(true)
    const [isInputFocused, setIsInputFocused] = useState(false)

    // Check states when menu opens
    useEffect(() => {
        if (visible) {
            const selection = window.getSelection()?.toString()
            setHasSelection(!!selection && selection.length > 0)
            
            const activeEl = document.activeElement
            const isInput = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement
            setIsInputFocused(isInput)
            
            // Check clipboard
            navigator.clipboard.readText()
                .then(text => setCanPaste(!!text))
                .catch(() => setCanPaste(false))
        }
    }, [visible])

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (visible && menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [visible, onClose])

    const handleUndo = () => {
        document.execCommand('undo')
        onClose()
    }

    const handleRedo = () => {
        document.execCommand('redo')
        onClose()
    }

    const handleRefresh = () => {
        window.location.reload()
        onClose()
    }

    const handleCut = () => {
        document.execCommand('cut')
        onClose()
    }

    const handleCopy = () => {
        document.execCommand('copy')
        onClose()
    }

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText()
            document.execCommand('insertText', false, text)
        } catch {
            document.execCommand('paste')
        }
        onClose()
    }

    const handlePastePlainText = async () => {
        try {
            const text = await navigator.clipboard.readText()
            document.execCommand('insertText', false, text)
        } catch {
            document.execCommand('paste')
        }
        onClose()
    }

    const handleSelectAll = () => {
        const activeEl = document.activeElement
        if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
            activeEl.select()
        } else {
            document.execCommand('selectAll')
        }
        onClose()
    }

    // Adjust position to prevent overflow
    let adjustedX = x
    let adjustedY = y
    if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect()
        if (x + rect.width > window.innerWidth) {
            adjustedX = window.innerWidth - rect.width - 8
        }
        if (y + rect.height > window.innerHeight) {
            adjustedY = window.innerHeight - rect.height - 8
        }
    }
    
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    style={{ top: adjustedY, left: adjustedX }}
                    className="fixed z-[9999] min-w-[200px] py-1.5 rounded-lg border border-border bg-popover shadow-2xl flex flex-col overflow-hidden"
                >
                    <MenuItem 
                        label="Undo" 
                        shortcut="Ctrl+Z" 
                        onClick={handleUndo}
                        disabled={!isInputFocused}
                    />
                    <MenuItem 
                        label="Redo" 
                        shortcut="Ctrl+Shift+Z" 
                        onClick={handleRedo}
                        disabled={!isInputFocused}
                    />
                    <MenuItem 
                        label="Refresh" 
                        shortcut="F5" 
                        onClick={handleRefresh}
                        icon={<RefreshCw className="w-3.5 h-3.5" />}
                    />
                    
                    <div className="h-px bg-border my-1.5" />

                    <MenuItem 
                        label="Cut" 
                        shortcut="Ctrl+X" 
                        onClick={handleCut}
                        disabled={!hasSelection}
                    />
                    <MenuItem 
                        label="Copy" 
                        shortcut="Ctrl+C" 
                        onClick={handleCopy}
                        disabled={!hasSelection}
                    />
                    <MenuItem 
                        label="Paste" 
                        shortcut="Ctrl+V" 
                        onClick={handlePaste}
                        disabled={!canPaste}
                    />
                    <MenuItem 
                        label="Paste as plain text" 
                        shortcut="Ctrl+Shift+V" 
                        onClick={handlePastePlainText}
                        disabled={!canPaste}
                    />

                    <div className="h-px bg-border my-1.5" />

                    <MenuItem 
                        label="Select all" 
                        shortcut="Ctrl+A" 
                        onClick={handleSelectAll}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function MenuItem({ 
    label, 
    onClick, 
    shortcut,
    disabled = false,
    icon
}: { 
    label: string
    onClick: () => void
    shortcut?: string
    disabled?: boolean
    icon?: React.ReactNode 
}) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center justify-between gap-4 px-3 py-1.5 text-[13px] w-full text-left
                transition-colors duration-75
                ${disabled 
                    ? 'text-muted-foreground/40 cursor-default' 
                    : 'text-foreground hover:bg-accent'
                }
            `}
        >
            <span className="flex items-center gap-2">
                {icon}
                {label}
            </span>
            {shortcut && (
                <span className={`text-[12px] ${disabled ? 'text-muted-foreground/30' : 'text-muted-foreground'}`}>
                    {shortcut}
                </span>
            )}
        </button>
    )
}
