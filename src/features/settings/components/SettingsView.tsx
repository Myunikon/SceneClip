import { useState, useRef, useEffect, useCallback } from 'react'
import { Globe, Palette, HardDrive, Film, Info, FileClock, Cpu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { TerminalView } from './TerminalView'
import { AppSettings } from '@/store/slices/types'

// COMPONENTS
import { GeneralSettings } from './GeneralSettings'
import { DownloadSettings } from './DownloadSettings'
import { MediaSettings } from './MediaSettings'
import { NetworkSettings } from './NetworkSettings'
import { SystemSettings } from './SystemSettings'
import { AboutSettings } from './AboutSettings'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarButtonProps {
    tab: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }
    isActive: boolean
    onClick: () => void
    buttonRef?: React.Ref<HTMLButtonElement>
    onKeyDown?: (e: React.KeyboardEvent) => void
}

function SidebarButton({ tab, isActive, onClick, buttonRef, onKeyDown }: SidebarButtonProps) {
    const [isEnabled, setIsEnabled] = useState(false)
    const localRef = useRef<HTMLButtonElement>(null)
    const textRef = useRef<HTMLSpanElement>(null)

    // Merge refs
    const setRef = (element: HTMLButtonElement | null) => {
        (localRef as React.MutableRefObject<HTMLButtonElement | null>).current = element
        if (typeof buttonRef === 'function') buttonRef(element)
        else if (buttonRef) (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = element
    }

    useEffect(() => {
        const check = () => {
            const btn = localRef.current
            const txt = textRef.current
            if (!btn || !txt) return

            // 1. Check if "Icon Mode" (collapsed)
            // A simple heuristic: if button width is small (e.g. < 100px), we assume icon mode.
            const isIconMode = btn.offsetWidth < 100

            // 2. Check if text truncated
            const isTruncated = txt.scrollWidth > txt.clientWidth + 1

            // Enable tooltip if either condition is met
            setIsEnabled(isIconMode || isTruncated)
        }

        check()
        const observer = new ResizeObserver(check)
        if (localRef.current) observer.observe(localRef.current)
        if (textRef.current) observer.observe(textRef.current)

        return () => observer.disconnect()
    }, [tab.label])

    return (
        <Tooltip side="right" open={isEnabled ? undefined : false}>
            <TooltipTrigger asChild>
                <button
                    ref={setRef}
                    onClick={onClick}
                    onKeyDown={onKeyDown}
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    className={cn(
                        "relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-full text-left transition-all duration-200 group sidebar-button focus:outline-none focus:ring-1 focus:ring-primary/50",
                        isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                    )}
                >
                    <tab.icon className={cn(
                        "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "opacity-100" : "opacity-70"
                    )} />
                    <span
                        ref={textRef}
                        className="sidebar-label flex-1 truncate text-left"
                    >
                        {tab.label}
                    </span>
                </button>
            </TooltipTrigger>
            <TooltipContent>
                {tab.label}
            </TooltipContent>
        </Tooltip>
    )
}

export interface SettingsViewProps {
    initialTab?: 'general' | 'downloads' | 'media' | 'network' | 'system' | 'about' | 'logs'
}

type TabId = 'general' | 'downloads' | 'media' | 'network' | 'system' | 'about' | 'logs';

export function SettingsView({ initialTab }: SettingsViewProps) {
    const { settings, updateSettings, addLog } = useAppStore(
        useShallow((s) => ({
            settings: s.settings,
            updateSettings: s.updateSettings,
            addLog: s.addLog
        }))
    )
    const { t } = useTranslation()
    const [showEasterEgg, setShowEasterEgg] = useState(false)

    // Auto-Save helper
    const setSetting = useCallback(<K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
        // Defer to avoid setState-during-render cascade with AppGuard
        queueMicrotask(() => updateSettings({ [key]: val }))
    }, [updateSettings])

    const [activeTab, setActiveTab] = useState<TabId>(initialTab || 'general')

    // Fixed: Deep Linking using useEffect instead of setState initializer anti-pattern
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab)
    }, [initialTab])

    const tabs = [
        { id: 'general' as TabId, label: t('settings.tabs.general') || "General", icon: Palette },
        { id: 'downloads' as TabId, label: t('settings.tabs.downloads') || "Downloads", icon: HardDrive },
        { id: 'media' as TabId, label: t('settings.tabs.media') || "Media", icon: Film },
        { id: 'network' as TabId, label: t('settings.tabs.network') || "Network", icon: Globe },
        { id: 'system' as TabId, label: t('settings.tabs.system') || "System", icon: Cpu },
        ...(settings.developerMode ? [{ id: 'logs' as TabId, label: t('settings.tabs.logs') || "Logs", icon: FileClock }] : []),
        { id: 'about' as TabId, label: t('settings.tabs.about') || "About", icon: Info },
    ]

    const scrollRef = useRef<HTMLDivElement>(null)
    const [isScrolled, setIsScrolled] = useState(false)

    // Fixed: Debounced scroll handler to avoid performance issues
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        let timeoutId: number
        const handleScroll = () => {
            if (timeoutId) cancelAnimationFrame(timeoutId)
            timeoutId = requestAnimationFrame(() => {
                setIsScrolled(el.scrollTop > 20)
            })
        }

        el.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            el.removeEventListener('scroll', handleScroll)
            if (timeoutId) cancelAnimationFrame(timeoutId)
        }
    }, [])

    const activeTabLabel = tabs.find(t => t.id === activeTab)?.label

    // Keyboard Navigation
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            const nextIndex = (index + 1) % tabs.length
            buttonRefs.current[nextIndex]?.focus()
            setActiveTab(tabs[nextIndex].id)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            const prevIndex = (index - 1 + tabs.length) % tabs.length
            buttonRefs.current[prevIndex]?.focus()
            setActiveTab(tabs[prevIndex].id)
        }
    }

    return (
        <div className="h-full flex flex-row overflow-hidden bg-background cq-settings-view">
            {/* Easter Egg Modal Overlay */}
            <AnimatePresence>
                {showEasterEgg && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-center">
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEasterEgg(false)}
                            className="absolute inset-0 bg-black/95 supports-[backdrop-filter]:bg-black/80 supports-[backdrop-filter]:backdrop-blur-md"
                        />
                        <motion.div
                            key="modal"
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
                                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/25 focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                                {t('settings.about_page.awesome') || "Awesome!"}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* FLUID ADAPTIVE SIDEBAR: Space-aware resizing */}
            <div className="flex flex-col flex-shrink-0 flex-grow-0 sidebar-container cq-sidebar bg-secondary border-r border-border/40 supports-[backdrop-filter]:bg-secondary/10 supports-[backdrop-filter]:backdrop-blur-xl pt-6 px-3">
                <div className="px-3 mb-6 sidebar-title">
                    <h2 className="text-xl font-bold tracking-tight text-foreground/80 truncate">{t('settings.title') || "Settings"}</h2>
                </div>

                <div className="flex flex-col gap-1.5" role="tablist" aria-orientation="vertical">
                    {tabs.map((tab, index) => (
                        <SidebarButton
                            key={tab.id}
                            tab={tab}
                            isActive={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            buttonRef={(el) => { buttonRefs.current[index] = el }}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className={cn(
                    "flex items-center px-8 py-4 border-b transition-all duration-500 z-30 bg-background/40 backdrop-blur-xl absolute top-0 left-0 right-0 supports-[backdrop-filter]:bg-background/20",
                    isScrolled ? "border-border/40 h-14 shadow-sm translate-y-0 opacity-100" : "border-transparent h-14 -translate-y-full opacity-0 pointer-events-none"
                )}>
                    <span className="font-semibold">{activeTabLabel}</span>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-4 sm:px-[clamp(1rem,5vw,2rem)] pb-20 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20"
                >
                    <div className="max-w-4xl mx-auto w-full">
                        <div className="pt-8 pb-6 sm:pt-10 sm:pb-8">
                            <h1 className="text-3xl sm:text-[clamp(1.875rem,5vw,2.25rem)] font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-2 duration-500">
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

                            {activeTab === 'media' && (
                                <MediaSettings
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

                            {activeTab === 'system' && (
                                <SystemSettings
                                    settings={settings}
                                    setSetting={setSetting}
                                    updateSettings={updateSettings}
                                />
                            )}


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
