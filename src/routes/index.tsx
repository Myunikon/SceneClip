import { createFileRoute } from '@tanstack/react-router'
import { DownloadsView } from '../features/downloads/components'

export const Route = createFileRoute('/')(({
    component: () => (
        <div className="p-6 max-w-6xl mx-auto w-full h-full flex flex-col animate-in fade-in zoom-in-[0.98] duration-200">
            <div className="flex-1 border rounded-xl bg-card/60 backdrop-blur-md shadow-sm overflow-hidden flex flex-col border-border/30">
                <DownloadsView />
            </div>
        </div>
    ),
}))
