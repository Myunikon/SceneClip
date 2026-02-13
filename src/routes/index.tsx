import { createFileRoute } from '@tanstack/react-router'
import { DownloadsView } from '../features/downloads/components'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/')({
    component: () => (
        <motion.div
            key="downloads"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="p-6 max-w-6xl mx-auto w-full h-full flex flex-col"
        >
            <div className="flex-1 border rounded-xl bg-card/60 backdrop-blur-md shadow-sm overflow-hidden flex flex-col border-white/5">
                <DownloadsView />
            </div>
        </motion.div>
    ),
})
