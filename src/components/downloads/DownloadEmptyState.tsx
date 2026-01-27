import { Download } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'
import { getShortcutSymbol } from '../../lib/platform'
import youtubeIcon from '../../assets/platforms/youtube.png'
import instagramIcon from '../../assets/platforms/instagram.png'
import tiktokIcon from '../../assets/platforms/tiktok.png'
import facebookIcon from '../../assets/platforms/facebook.png'
import xIcon from '../../assets/platforms/x.png'

export function DownloadEmptyState() {
    const { t } = useTranslation()
    const MOD = getShortcutSymbol()

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-transparent">
            <div className="max-w-md w-full text-center space-y-4">
                {/* Icon Container - Minimal */}
                <div className="relative inline-block group">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-75 opacity-0 group-hover:opacity-100" />
                    <div className="relative w-16 h-16 mx-auto bg-secondary/30 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-secondary/50">
                        <Download className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                </div>

                {/* Text Content - Subtle */}
                <div className="space-y-2">
                    <h3 className="text-lg font-medium text-foreground/80">
                        {t('downloads.empty') || "No downloads yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-xs mx-auto">
                        <Trans
                            i18nKey="empty_state.description"
                            defaults="Paste a link or press <1>{{mod}}+N</1> to start."
                            values={{ mod: MOD }}
                            components={{ 1: <span className="font-mono text-primary/80" /> }}
                        />
                    </p>
                </div>

                {/* Minimal Platform Indicators - With PNG Icons */}
                <div className="pt-2 flex items-center justify-center gap-3 opacity-60 hover:opacity-100">
                    {[
                        { icon: youtubeIcon, label: "YouTube" },
                        { icon: instagramIcon, label: "Instagram" },
                        { icon: tiktokIcon, label: "TikTok" },
                        { icon: facebookIcon, label: "Facebook" },
                        { icon: xIcon, label: "X (Twitter)" }
                    ].map((platform, i) => (
                        <div key={i} className="relative group/icon p-1 rounded-lg hover:bg-white/5 cursor-default" title={platform.label}>
                            <img
                                src={platform.icon}
                                alt={platform.label}
                                className="w-5 h-5 object-contain grayscale opacity-50 group-hover/icon:grayscale-0 group-hover/icon:opacity-100"
                            />
                        </div>
                    ))}
                    <span className="text-xs text-muted-foreground pl-1">{t('downloads.plus_more') || "+1000 more"}</span>
                </div>
            </div>
        </div>
    )
}
