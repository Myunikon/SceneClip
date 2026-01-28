import { createFileRoute } from '@tanstack/react-router'
import { HistoryView } from '../components/history'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/history')({
    component: () => (
        <motion.div
            key="history"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full h-full flex flex-col overflow-hidden"
        >
            <HistoryView />
        </motion.div>
    ),
})
