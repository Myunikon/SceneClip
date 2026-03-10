import { createFileRoute } from '@tanstack/react-router'
import { SettingsView } from '../features/settings/components'

export const Route = createFileRoute('/settings')({
    validateSearch: (search: Record<string, unknown>): { tab?: string } => {
        return {
            tab: (search.tab as string) || undefined,
        }
    },
    component: SettingsPage,
})

function SettingsPage() {
    const { tab } = Route.useSearch()

    return (
        <div className="w-full h-full bg-card/60 backdrop-blur-md rounded-xl border border-border/50 shadow-xl overflow-hidden animate-in fade-in zoom-in-[0.98] duration-200">
            <SettingsView initialTab={tab as 'general' | 'downloads' | 'media' | 'network' | 'system' | 'about' | 'logs'} />
        </div>
    )
}
