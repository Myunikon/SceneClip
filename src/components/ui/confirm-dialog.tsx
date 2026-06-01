import { AlertTriangle } from 'lucide-react'
import { Modal } from './modal'

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
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="sm"
            headerBg="bg-red-500/5"
            headerIcon={
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
            }
        >
            <div className="p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-4 pt-0">
                <button 
                    onClick={onClose} 
                    className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-lg font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    {cancelLabel}
                </button>
                <button 
                    onClick={() => { onConfirm(); onClose() }} 
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap shadow-md shadow-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    )
}
