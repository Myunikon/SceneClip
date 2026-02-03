import { Download } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'
import { useState } from 'react'
import { getShortcutSymbol } from '../../lib/platform'
import { TypingAnimation } from '@/registry/magicui/typing-animation'

export function DownloadEmptyState() {
    const { t } = useTranslation()
    const MOD = getShortcutSymbol()

    // Unified Typography
    const TEXT_CLASSES = "text-lg font-medium text-foreground/80 tracking-[-0.01em] drop-shadow-sm whitespace-nowrap"

    // State to track if animation should play - initialize lazy to avoid flicker
    const [shouldAnimate, setShouldAnimate] = useState(() => {
        return !sessionStorage.getItem("emptyStatePlayed")
    })

    // State to show subtext - show immediately if animation played
    const [showSubtext, setShowSubtext] = useState(() => {
        return !!sessionStorage.getItem("emptyStatePlayed")
    })

    const handleAnimationComplete = () => {
        setShowSubtext(true)
        setShouldAnimate(false) // Switch to static text to prevent re-animation on hot reload/updates (optional but cleaner)
        sessionStorage.setItem("emptyStatePlayed", "true")
    }

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-transparent text-center select-none">
            {/* Minimalist Icon */}
            <div className="mb-4 opacity-20">
                <Download className="w-16 h-16 stroke-[1.5]" />
            </div>

            {/* Simple Text */}
            <h3 className="mb-1 min-h-[28px]">
                {shouldAnimate ? (
                    <TypingAnimation
                        className={TEXT_CLASSES}
                        onComplete={handleAnimationComplete}
                    >
                        {t('downloads.empty') || "No downloads yet"}
                    </TypingAnimation>
                ) : (
                    <span className={TEXT_CLASSES}>
                        {t('downloads.empty') || "No downloads yet"}
                    </span>
                )}
            </h3>

            <div className={`transition-opacity duration-500 min-h-[44px] flex items-start justify-center ${showSubtext ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                    <Trans
                        i18nKey="empty_state.description"
                        defaults="Copy a link and press <1>{{mod}}+N</1> to start."
                        values={{ mod: MOD }}
                        components={{ 1: <span className="font-medium text-foreground/70" /> }}
                    />
                </p>
            </div>
        </div>
    )
}
