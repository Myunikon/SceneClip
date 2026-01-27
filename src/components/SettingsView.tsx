import { useState, useRef } from 'react'
import { Settings, Globe, Zap, Database, Cpu, ScrollText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils'
import { useAppStore } from '../store'
import { TerminalView } from './TerminalView'
import { AppSettings } from '../store/slices/types'

// NEW HEADER IMPORTS
import { GeneralSettings } from './settings/GeneralSettings'
import { DownloadSettings } from './settings/DownloadSettings'
import { QualitySettings } from './settings/QualitySettings'
import { NetworkSettings } from './settings/NetworkSettings'
import { SystemSettings } from './settings/SystemSettings'
import { AboutSettings } from './settings/AboutSettings'



export interface SettingsViewProps {
    initialTab?: 'general' | 'downloads' | 'quality' | 'network' | 'advanced' | 'about' | 'logs'
}

export function SettingsView({ initialTab }: SettingsViewProps) {
    const { settings, updateSettings, addLog } = useAppStore()
    const { t } = useTranslation()
    const [showEasterEgg, setShowEasterEgg] = useState(false)

    // Auto-Save: Direct Store Updates with Type Safety
    const setSetting = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
        updateSettings({ ...settings, [key]: val })
    }

    const [activeTab, setActiveTab] = useState<'general' | 'downloads' | 'quality' | 'network' | 'advanced' | 'about' | 'logs'>('general')

    // Sync prop changes (Deep Linking)
    useState(() => {
        if (initialTab) setActiveTab(initialTab)
    })
    // Also watch for changes if user navigates while mounted
    const [prevInitialTab, setPrevInitialTab] = useState(initialTab)
    if (initialTab !== prevInitialTab) {
        setPrevInitialTab(initialTab)
        if (initialTab) setActiveTab(initialTab)
    }

    type TabId = 'general' | 'downloads' | 'quality' | 'network' | 'advanced' | 'about' | 'logs'
    const tabs = [
        { id: 'general' as TabId, label: t('settings.tabs.general'), icon: Settings },
        { id: 'downloads' as TabId, label: t('settings.tabs.downloads'), icon: Database },
        { id: 'quality' as TabId, label: t('settings.tabs.quality'), icon: Zap },
        { id: 'network' as TabId, label: t('settings.tabs.network'), icon: Globe },
        { id: 'advanced' as TabId, label: t('settings.tabs.advanced'), icon: Cpu },
        ...(settings.developerMode ? [{ id: 'logs' as TabId, label: t('settings.tabs.logs') || "Logs", icon: ScrollText }] : []),
        { id: 'about' as TabId, label: t('settings.tabs.about'), icon: Database },
    ]

    // Scroll Logic for Large Title Collapse
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isScrolled, setIsScrolled] = useState(false)

    const handleScroll = () => {
        if (!scrollRef.current) return
        setIsScrolled(scrollRef.current.scrollTop > 20)
    }

    const activeTabLabel = tabs.find(t => t.id === activeTab)?.label

    return (
        <div className="h-full flex flex-col md:flex-row overflow-hidden bg-background">
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
                            {t('settings.about_page.secret_found')}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {t('settings.about_page.secret_desc')} <br />
                            <span className="text-xs opacity-50">{t('settings.about_page.secret_sub')}</span>
                        </p>
                        <button
                            onClick={() => setShowEasterEgg(false)}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/25"
                        >
                            {t('settings.about_page.awesome')}
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

            {/* MOBILE: Horizontal Scroll Navigation */}
            <div className="md:hidden flex overflow-x-auto pb-2 gap-2 scrollbar-hide p-2 snap-x border-b border-border/40 bg-secondary/10 shrink-0">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full z-10 whitespace-nowrap snap-start transition-all",
                            activeTab === tab.id
                                ? "text-background font-bold shadow-sm"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="settings-pill-mobile"
                                className="absolute inset-0 bg-foreground rounded-full -z-10 shadow-md"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon className={cn("w-4 h-4 relative z-10 shrink-0", activeTab === tab.id ? "text-background" : "")} />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* DESKTOP: Native Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-secondary/10 border-r border-border/40 shrink-0 backdrop-blur-xl pt-6 px-3">
                {/* Settings Header in Sidebar */}
                <div className="px-3 mb-4">
                    <h2 className="text-xl font-bold tracking-tight text-foreground/80">{t('settings.title')}</h2>
                </div>

                {/* Tab Buttons */}
                <div className="flex flex-col gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors duration-200",
                                activeTab === tab.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4 shrink-0 opacity-70", activeTab === tab.id ? "opacity-100" : "")} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Collapsible Header (Desktop) - Mimics macOS Toolbar/Title separation */}
                <div className={cn(
                    "hidden md:flex items-center px-8 py-4 border-b transition-all duration-500 z-10 bg-background/40 backdrop-blur-xl absolute top-0 left-0 right-0 supports-[backdrop-filter]:bg-background/20",
                    isScrolled ? "border-border/40 h-14 shadow-sm translate-y-0 opacity-100" : "border-transparent h-14 -translate-y-full opacity-0 pointer-events-none"
                )}>
                    <span className="font-semibold">{activeTabLabel}</span>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 md:px-8 pb-20 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20"
                >
                    <div className="max-w-4xl mx-auto w-full">
                        {/* Large Title */}
                        <div className="pt-8 pb-6 md:pt-10 md:pb-8">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {activeTabLabel}
                            </h1>
                        </div>

                        <div className="space-y-6 pb-12">
                            {activeTab === 'general' && (
                                <GeneralSettings
                                    settings={settings}
                                    setSetting={setSetting}
                                />
                            )}

                            {activeTab === 'downloads' && (
                                <DownloadSettings
                                    settings={settings}
                                    setSetting={setSetting}
                                />
                            )}

                            {activeTab === 'quality' && (
                                <QualitySettings
                                    settings={settings}
                                    setSetting={setSetting}
                                />
                            )}

                            {activeTab === 'network' && (
                                <NetworkSettings
                                    settings={settings}
                                    setSetting={setSetting}
                                />
                            )}

                            {activeTab === 'advanced' && (
                                <SystemSettings
                                    settings={settings}
                                    setSetting={setSetting}
                                    updateSettings={updateSettings}
                                />
                            )}

                            {/* Logs are heavy, lets keep them conditional or check performance. 
                                Actually, logs should definitely stick around to not lose history if it was just an in-memory buffer.
                                But typically TerminalView might have its own internal state. Let's persist it too. */}
                            <div className={cn("h-[calc(100vh-200px)] min-h-[400px] animate-in fade-in slide-in-from-bottom-2", activeTab === 'logs' ? 'block' : 'hidden')}>
                                <TerminalView />
                            </div>

                            {activeTab === 'about' && (
                                <AboutSettings
                                    addLog={addLog}
                                    setShowEasterEgg={setShowEasterEgg}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
