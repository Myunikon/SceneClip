import { Download, History, Settings, HelpCircle, PlusCircle, Keyboard, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from '@tanstack/react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
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
        <header data-tauri-drag-region className="relative h-16 border-b border-border/50 bg-background/95 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center px-6 z-50 gap-4 cq-header will-change-transform">
            {/* Left: Branding */}
            <div className="flex justify-start items-center gap-3 header-branding">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-lg tracking-tight header-title header-branding-text">Scene<span className="text-primary">Clip</span></h1>
            </div>

            {/* Center: Navigation - Adaptive Desktop */}
            <nav className="flex items-center bg-secondary/50 rounded-full p-1 border overflow-hidden shrink-0 z-10 header-nav-container">
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
                            "relative px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 z-10 whitespace-nowrap header-nav-item",
                            activeTab === tab.id
                                ? "text-primary shadow-sm bg-background"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className="w-4 h-4 relative z-10" />
                        <span className="relative z-10 header-label">{tab.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Right: Actions */}
            <div className="flex justify-end items-center gap-1 header-actions-container">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            onClick={onOpenShortcuts}
                            className="flex h-auto w-auto p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground header-shortcut-btn"
                        >
                            <Keyboard className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('guide.sections.shortcuts') || 'Keyboard Shortcuts'}</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            onClick={onOpenGuide}
                            className="flex h-auto w-auto p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground header-guide-btn"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('guide.title')}</p>
                    </TooltipContent>
                </Tooltip>

                <div className="flex items-center">
                    <Button
                        onClick={openDialog}
                        className="h-auto w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20 text-sm font-bold whitespace-nowrap justify-center header-new-btn"
                    >
                        <span className="header-new-btn-label">{t('downloads.new_download')}</span>
                        <PlusCircle className="w-4 h-4 header-new-btn-icon" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
