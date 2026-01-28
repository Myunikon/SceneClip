import { createFileRoute } from '@tanstack/react-router'
import { SettingsView } from '../components/settings'
import { motion } from 'framer-motion'

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
    // We need to lift this state up if possible, or keep it local here?
    // In App.tsx it was lifted for language preview on AddDialog.
    // Ideally this should be in the store or a context if needed globally.
    // For now, let's keep it local or pass a dummy if AddDialog isn't using it yet from here.
    // Wait, AddDialog uses previewLang prop.
    // If we want to support previewLang, we might need a context or store slice.
    // For now, let's ignore previewLang on AddDialog from Router (minor feature).
    // Or actually, App.tsx had it.

    return (
        <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full h-full bg-card/60 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden"
        >
            <SettingsView initialTab={tab as 'general' | 'downloads' | 'quality' | 'network' | 'advanced' | 'about' | 'logs'} />
        </motion.div>
    )
}
