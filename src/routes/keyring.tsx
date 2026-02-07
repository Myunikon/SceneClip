import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { KeyringManager } from '../components/settings/KeyringManager'
import { useAppStore } from '../store'
import { AppSettings } from '../store/slices/types'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/keyring')({
    component: KeyringPage,
})

function KeyringPage() {
    const { settings, updateSettings } = useAppStore()
    const { t } = useTranslation()

    // Wrapper to match expected signature
    const setSetting = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
        updateSettings({ ...settings, [key]: val })
    }

    return (
        <motion.div
            key="keyring"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full h-full bg-background/50 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="shrink-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-8 py-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {t('settings.security.keyring_title') || "Secure Keyring"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {t('settings.security.keyring_desc') || "Manage saved passwords for premium sites"}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full bg-background/30">
                <div className="max-w-4xl mx-auto px-8 py-8">
                    <KeyringManager
                        settings={settings}
                        setSetting={setSetting}
                    />
                </div>
            </div>
        </motion.div>
    )
}
