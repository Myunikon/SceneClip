import { AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmLabel: string
    cancelLabel: string
}

export function ConfirmDialog({ 
    isOpen, 
    onClose, 
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel
}: ConfirmDialogProps) {
    const { settings } = useAppStore()
    const isLowPerf = settings.lowPerformanceMode

    if (!isOpen) return null

    // Low-perf mode: static version
    if (isLowPerf) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div onClick={onClose} className="absolute inset-0 bg-black/70" />
                <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-red-500/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="font-bold text-lg">{title}</h3>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                    </div>
                    <div className="flex gap-3 p-4 pt-0">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-lg font-medium">
                            {cancelLabel}
                        </button>
                        <button onClick={() => { onConfirm(); onClose() }} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium">
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Normal mode: animated version
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl relative z-10 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-border bg-red-500/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="font-bold text-lg">{title}</h3>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                    </div>
                    <div className="flex gap-3 p-4 pt-0">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors">
                            {cancelLabel}
                        </button>
                        <button onClick={() => { onConfirm(); onClose() }} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
                            {confirmLabel}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}


