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

    return (
        <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full h-full bg-card/60 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden"
        >
            <SettingsView initialTab={tab as 'general' | 'downloads' | 'media' | 'network' | 'system' | 'about' | 'logs'} />
        </motion.div>
    )
}
