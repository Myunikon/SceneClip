import { createFileRoute } from '@tanstack/react-router'
import { HistoryView } from '../features/history/components'

export const Route = createFileRoute('/history')(({
    component: () => (
        <div className="w-full h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-[0.98] duration-200">
            <HistoryView />
        </div>
    ),
}))
