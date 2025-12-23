import { ReactNode } from 'react'
import { Background } from '../Background'
import { WifiOff, Download } from 'lucide-react'
import { translations } from '../../lib/locales'
import { useAppStore } from '../../store'

interface AppLayoutProps {
  children: ReactNode
  isOffline: boolean
  language: string
}

export function AppLayout({ children, isOffline, language }: AppLayoutProps) {
    // Determine translation for "Offline"
    const t = translations[language as keyof typeof translations] || translations['en']
    const { ytdlpNeedsUpdate, ytdlpLatestVersion, ytdlpUpdateUrgency, updateYtDlp } = useAppStore()

    return (
        <div className="h-screen w-screen flex flex-col text-foreground font-sans overflow-hidden selection:bg-primary/30 relative">
            <Background />
             
            {/* OFFLINE WARNING BANNER */}
            {isOffline && (
                <div className="absolute top-16 left-0 right-0 z-40 bg-red-500/10 border-b border-red-500/20 text-red-500 px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                    <WifiOff className="w-3.5 h-3.5" />
                    {t.status.offline}
                </div>
            )}

            {/* YT-DLP UPDATE BANNER - Style based on urgency */}
            {ytdlpNeedsUpdate && !isOffline && (
                <div className={`absolute top-16 left-0 right-0 z-40 border-b px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-3 animate-in slide-in-from-top-2 ${
                    ytdlpUpdateUrgency === 'critical' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                        : 'bg-blue-500/5 border-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}>
                    <span>
                        {ytdlpUpdateUrgency === 'critical' 
                            ? '⚠️ Critical Update Required: '
                            : 'Update available: '}
                        <strong>{ytdlpLatestVersion}</strong>
                    </span>
                    <button 
                        onClick={() => updateYtDlp()}
                        className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                            ytdlpUpdateUrgency === 'critical'
                                ? 'bg-red-500/20 hover:bg-red-500/30'
                                : 'bg-blue-500/20 hover:bg-blue-500/30'
                        }`}
                    >
                        <><Download className="w-3 h-3" /> {t.updater_banner.update_now}</>
                    </button>
                </div>
            )}

            {children}
        </div>
    )
}
