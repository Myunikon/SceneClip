import { motion } from 'framer-motion'
import { Download, Terminal as TerminalIcon, Scissors, Zap, Globe, AlertCircle, ChevronRight, Layers, Waypoints, Languages, FileCode } from 'lucide-react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useTranslation, Trans } from 'react-i18next'
import { Updater } from '../providers'
import { AuroraText } from '@/registry/magicui/aurora-text'


interface AboutSettingsProps {
    addLog: (entry: { message: string, type: 'info' | 'error' | 'success' }) => void
    setShowEasterEgg: (show: boolean) => void
}

export function AboutSettings({ addLog, setShowEasterEgg }: AboutSettingsProps) {
    const { t } = useTranslation()

    const techItems = [
        { id: 'yt-dlp', name: 'yt-dlp', role: t('settings.about_page.role_core'), Icon: TerminalIcon, link: 'https://github.com/yt-dlp/yt-dlp', color: 'text-foreground' },
        { id: 'ffmpeg', name: 'FFmpeg', role: t('settings.about_page.role_media'), Icon: Scissors, link: 'https://ffmpeg.org', color: 'text-green-600 dark:text-green-400' },
        { id: 'tauri', name: 'Tauri', role: t('settings.about_page.role_framework'), Icon: Zap, link: 'https://tauri.app', color: 'text-yellow-600 dark:text-yellow-400' },
        {
            id: 'react', name: 'React', role: t('settings.about_page.role_ui'), Icon: (props: any) => (
                <svg className={`w-5 h-5 ${props.className}`} viewBox="-11.5 -10.23174 23 20.46348">
                    <circle cx="0" cy="0" r="2.05" fill="currentColor" />
                    <g stroke="currentColor" strokeWidth="1" fill="none">
                        <ellipse rx="11" ry="4.2" />
                        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                    </g>
                </svg>
            ), link: 'https://react.dev', color: 'text-cyan-500'
        },
        { id: 'zustand', name: 'Zustand', role: t('settings.about_page.role_state'), Icon: Layers, link: 'https://zustand-demo.pmnd.rs', color: 'text-orange-500' },
        { id: 'router', name: 'TanStack Router', role: t('settings.about_page.role_routing'), Icon: Waypoints, link: 'https://tanstack.com/router', color: 'text-emerald-500' },
        { id: 'i18next', name: 'i18next', role: t('settings.about_page.role_i18n'), Icon: Languages, link: 'https://www.i18next.com', color: 'text-teal-500' },
        { id: 'typescript', name: 'TypeScript', role: t('settings.about_page.role_lang'), Icon: FileCode, link: 'https://www.typescriptlang.org', color: 'text-blue-600' },
        { id: 'lucide', name: 'Lucide', role: t('settings.about_page.role_icon'), Icon: Globe, link: 'https://lucide.dev', color: 'text-pink-600 dark:text-pink-400' },
        { id: 'sponsorblock', name: 'SponsorBlock', role: t('settings.about_page.role_api'), Icon: AlertCircle, link: 'https://sponsor.ajay.app', color: 'text-red-600 dark:text-red-400' },
    ]

    return (
        <div className="space-y-4 pb-8">
            {/* Hero */}
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <motion.div
                    className="w-24 h-24 bg-card rounded-[22px] shadow-xl flex items-center justify-center border border-border/50 cursor-pointer relative overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        const newCount = (window as any)._ee_count = ((window as any)._ee_count || 0) + 1
                        if (newCount === 5) {
                            addLog({ message: "🎉 EASTER EGG FOUND!", type: 'success' })
                            setShowEasterEgg(true)
                                ; (window as any)._ee_count = 0
                        }
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Download className="w-12 h-12 text-primary" />
                </motion.div>

                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Scene<AuroraText className="font-bold" stopAfter={10000}>Clip</AuroraText>
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                        Version 1.0.1 (New)
                    </p>
                </div>

                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                    {t('settings.about_page.desc')}
                </p>
            </div>

            <Updater />

            {/* Tech Stack */}
            {/* Tech Stack */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-4">
                    {t('settings.about_page.core')}
                </h3>
                <div className="border rounded-xl overflow-hidden bg-card/50 divide-y divide-border/50">
                    {techItems.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3 pl-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                            onClick={() => openUrl(item.link)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-md bg-background flex items-center justify-center border border-border/50 shadow-sm group-hover:scale-105 transition-transform`}>
                                    <item.Icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium leading-none">{item.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.role}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors mr-2" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="pt-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Trans
                        i18nKey="settings.about_page.made_with"
                        components={[
                            <span className="text-red-500 hover:scale-110 transition-transform cursor-default">❤️</span>,
                            <button
                                onClick={() => openUrl('https://github.com/Myunikon')}
                                className="font-semibold text-foreground hover:text-primary transition-colors ml-0.5"
                            >
                                Myunikon
                            </button>
                        ]}
                    />
                </p>

                <div className="text-xs text-muted-foreground/40 max-w-md mx-auto">
                    {t('settings.about_page.legal_text')}
                </div>
            </div>
        </div>
    )
}
