import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from './modal'

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'default'
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = 'default'
}: ConfirmationModalProps) {
    const { t } = useTranslation()

    const iconColorClass = variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidth="md"
            headerIcon={
                <div className={`p-1.5 rounded-full ${iconColorClass}`}>
                    <AlertTriangle className="w-5 h-5" />
                </div>
            }
        >
            <div className="p-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        {cancelLabel || t('dialog.cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-lg active:scale-95 transition-all focus:outline-none focus:ring-2
                            ${variant === 'danger'
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25 focus:ring-red-500/50'
                                : 'bg-primary hover:bg-primary/90 shadow-primary/25 focus:ring-primary/50'
                            }`}
                    >
                        {confirmLabel || t('dialog.confirm')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
