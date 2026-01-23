import { useState, useEffect } from 'react'
import { Settings, Globe, Zap, Database, Terminal as TerminalIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'
import { useAppStore } from '../store'
import { translations } from '../lib/locales'
import { TerminalView } from './TerminalView'

// NEW HEADER IMPORTS
import { GeneralSettings } from './settings/GeneralSettings'
import { DownloadSettings } from './settings/DownloadSettings'
import { QualitySettings } from './settings/QualitySettings'
import { NetworkSettings } from './settings/NetworkSettings'
import { AdvancedSettings } from './settings/AdvancedSettings'
import { AboutSettings } from './settings/AboutSettings'

interface SettingsViewProps {
    toggleTheme: () => void
    setPreviewLang: (lang: string | null) => void
}

export function SettingsView({ toggleTheme, setPreviewLang }: SettingsViewProps) {
    const { settings, updateSettings, addLog } = useAppStore()
    const [showEasterEgg, setShowEasterEgg] = useState(false)

    // Auto-Save: Direct Store Updates
    const setSetting = (key: string, val: string | boolean | number | string[]) => {
        updateSettings({ ...settings, [key]: val })
    }

    // Derived computations (Language Preview)
    const t = translations[settings.language]

    // Sync language preview to Global App
    useEffect(() => {
        setPreviewLang(settings.language)
        return () => setPreviewLang(null)
    }, [settings.language])

    const [activeTab, setActiveTab] = useState<'general' | 'downloads' | 'quality' | 'network' | 'advanced' | 'about' | 'logs'>('general')

    type TabId = 'general' | 'downloads' | 'quality' | 'network' | 'advanced' | 'about' | 'logs'
    const tabs = [
        { id: 'general' as TabId, label: t.settings.tabs.general, icon: Settings },
        { id: 'downloads' as TabId, label: t.settings.tabs.downloads, icon: Database },
        { id: 'quality' as TabId, label: t.settings.tabs.quality, icon: Zap },
        { id: 'network' as TabId, label: t.settings.tabs.network, icon: Globe },
        { id: 'advanced' as TabId, label: t.settings.tabs.advanced, icon: TerminalIcon },
        ...(settings.developerMode ? [{ id: 'logs' as TabId, label: (t.settings.tabs as any).logs || "Logs", icon: TerminalIcon }] : []),
        { id: 'about' as TabId, label: t.settings.tabs.about, icon: Database },
    ]

    return (
        <div className={cn("p-6 h-full flex gap-6", "animate-in fade-in slide-in-from-bottom-4")}>
            {/* Easter Egg Modal Overlay */}
            {showEasterEgg && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEasterEgg(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0.5, rotate: 10, opacity: 0 }}
                        className="bg-gradient-to-br from-orange-900 to-slate-900 border border-orange-500/30 p-8 rounded-3xl shadow-2xl relative z-10 text-center max-w-sm w-full mx-auto"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-6xl mb-4 select-none"
                        >
                            🐣
                        </motion.div>
                        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-2">
                            {t.settings.about_page.secret_found}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {t.settings.about_page.secret_desc} <br />
                            <span className="text-xs opacity-50">{t.settings.about_page.secret_sub}</span>
                        </p>
                        <button
                            onClick={() => setShowEasterEgg(false)}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/25"
                        >
                            {t.settings.about_page.awesome}
                        </button>
                    </motion.div>
                    {/* Confetti Particles */}
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full pointer-events-none"
                            style={{
                                backgroundColor: ['#f97316', '#ef4444', '#fbbf24', '#b91c1c'][i % 4],
                                left: '50%', top: '50%'
                            }}
                            animate={{
                                x: (Math.random() - 0.5) * 500,
                                y: (Math.random() - 0.5) * 500,
                                opacity: [1, 0],
                                scale: [0, 1.5]
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    ))}
                </div>
            )}

            {/* Sidebar Navigation */}
            <div className="flex flex-col p-2 rounded-2xl shrink-0 border shadow-xl w-52 glass border-white/10 shadow-black/5">
                {/* Settings Header in Sidebar */}
                <div className="flex items-center gap-3 p-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-xl">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-foreground">
                        {t.settings.title}
                    </span>
                </div>

                {/* Tab Buttons */}
                <div className="flex flex-col gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl z-10 text-left transition-colors duration-200",
                                activeTab === tab.id
                                    ? "text-background font-bold shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                            )}
                        >
                            {/* Motion pill for active tab */}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="settings-pill"
                                    className="absolute inset-0 bg-foreground rounded-2xl -z-10 shadow-md shadow-black/10 dark:shadow-black/20"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <tab.icon className={cn("w-4 h-4 relative z-10 shrink-0", activeTab === tab.id ? "text-background" : "")} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 pb-20 scrollbar-hide">
                {activeTab === 'general' && (
                    <GeneralSettings
                        settings={settings}
                        setSetting={setSetting}
                        toggleTheme={toggleTheme}
                        t={t}
                    />
                )}

                {activeTab === 'downloads' && (
                    <DownloadSettings
                        settings={settings}
                        setSetting={setSetting}
                        t={t}
                    />
                )}

                {activeTab === 'quality' && (
                    <QualitySettings
                        settings={settings}
                        setSetting={setSetting}
                        t={t}
                    />
                )}

                {activeTab === 'network' && (
                    <NetworkSettings
                        settings={settings}
                        setSetting={setSetting}
                        t={t}
                    />
                )}


                {activeTab === 'advanced' && (
                    <AdvancedSettings
                        settings={settings}
                        setSetting={setSetting}
                        updateSettings={updateSettings}
                        t={t}
                    />
                )}

                {activeTab === 'logs' && (
                    <div className="h-[calc(100vh-200px)] min-h-[400px] animate-in fade-in slide-in-from-bottom-2">
                        <TerminalView />
                    </div>
                )}

                {activeTab === 'about' && (
                    <AboutSettings
                        t={t}
                        addLog={addLog}
                        setShowEasterEgg={setShowEasterEgg}
                    />
                )}
            </div>
        </div>
    )
}
