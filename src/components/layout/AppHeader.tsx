import { Download, History, Settings, HelpCircle, Plus, Keyboard, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from '@tanstack/react-router'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface AppHeaderProps {
    openDialog: () => void
    onOpenGuide: () => void
    onOpenShortcuts: () => void
}


export function AppHeader({ openDialog, onOpenGuide, onOpenShortcuts }: AppHeaderProps) {
    const { t } = useTranslation();
    const location = useLocation();

    const activeTab = location.pathname === '/' ? 'downloads'
        : location.pathname.includes('history') ? 'history'
            : location.pathname.includes('keyring') ? 'keyring'
                : location.pathname.includes('settings') ? 'settings'
                    : 'downloads';

    return (
        <header data-tauri-drag-region className="relative h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl shrink-0 flex items-center justify-between px-4 sm:px-6 z-50 gap-4">

            <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-lg shadow-orange-500/20 flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-lg tracking-tight hidden sm:block">Scene<span className="text-primary">Clip</span></h1>
            </div>

            {/* Navigation - Absolute Center */}
            <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center bg-secondary/50 rounded-full p-1 border overflow-hidden">
                {[
                    { id: 'downloads', path: '/', label: t('nav.downloads'), icon: Download },
                    { id: 'keyring', path: '/keyring', label: t('nav.keyring') || "Keyring", icon: Lock },
                    { id: 'history', path: '/history', label: t('history.title'), icon: History },
                    { id: 'settings', path: '/settings', label: t('nav.settings'), icon: Settings }
                ].map((tab) => (
                    <Link
                        key={tab.id}
                        to={tab.path}
                        className={cn(
                            "relative px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 z-10 transition-colors whitespace-nowrap",
                            activeTab === tab.id
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-background rounded-full shadow-sm -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.7 }}
                            />
                        )}
                        <tab.icon className="w-4 h-4 relative z-10" />
                        <span className={cn("relative z-10 hidden lg:inline")}>{tab.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Mobile Navigation (Icon Only) - Visible on small screens */}
            <nav className="md:hidden flex items-center bg-secondary/50 rounded-full p-1 border mx-auto">
                {[
                    { id: 'downloads', path: '/', label: t('nav.downloads'), icon: Download },
                    { id: 'keyring', path: '/keyring', label: t('nav.keyring') || "Keyring", icon: Lock },
                    { id: 'history', path: '/history', label: t('history.title'), icon: History },
                    { id: 'settings', path: '/settings', label: t('nav.settings'), icon: Settings }
                ].map((tab) => (
                    <Link
                        key={tab.id}
                        to={tab.path}
                        className={cn(
                            "relative p-2 rounded-full flex items-center justify-center z-10 transition-colors",
                            activeTab === tab.id
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="nav-pill-mobile"
                                className="absolute inset-0 bg-background rounded-full shadow-sm -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.7 }}
                            />
                        )}
                        <tab.icon className="w-4 h-4 relative z-10" />
                    </Link>
                ))}
            </nav>

            <div className="flex items-center gap-1 shrink-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={onOpenShortcuts}
                                className="hidden md:flex h-auto w-auto p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <Keyboard className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('guide.sections.shortcuts') || 'Keyboard Shortcuts'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={onOpenGuide}
                                className="hidden md:flex h-auto w-auto p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('guide.title')}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <Button
                    onClick={openDialog}
                    className="h-auto w-auto bg-primary hover:bg-primary/90 text-primary-foreground p-2 lg:px-4 lg:py-2 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20 text-sm font-bold whitespace-nowrap active:scale-95 transition-all aspect-square lg:aspect-auto justify-center"
                >
                    <Plus className="w-5 h-5 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline">{t('downloads.new_download')}</span>
                </Button>
            </div>
        </header>
    )
}
