import { Download } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'
import { useState, useEffect } from 'react'
import { getShortcutSymbol } from '../../lib/platform'
import { TypingAnimation } from '@/registry/magicui/typing-animation'

export function DownloadEmptyState() {
    const { t } = useTranslation()
    const MOD = getShortcutSymbol()

    // State to track if animation should play
    const [shouldAnimate, setShouldAnimate] = useState(false)
    // State to show subtext (initially hidden if animating)
    const [showSubtext, setShowSubtext] = useState(false)

    useEffect(() => {
        // Check if animation has played in this session
        const hasPlayed = sessionStorage.getItem("emptyStatePlayed")

        if (hasPlayed) {
            // If played, show everything immediately
            setShouldAnimate(false)
            setShowSubtext(true)
        } else {
            // If not played, start animation
            setShouldAnimate(true)
            setShowSubtext(false)
        }
    }, [])

    const handleAnimationComplete = () => {
        setShowSubtext(true)
        sessionStorage.setItem("emptyStatePlayed", "true")
    }

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-transparent text-center select-none">
            {/* Minimalist Icon */}
            <div className="mb-4 opacity-20">
                <Download className="w-16 h-16 stroke-[1.5]" />
            </div>

            {/* Simple Text */}
            <h3 className="text-lg font-medium text-foreground/80 mb-1 min-h-[28px]">
                {shouldAnimate ? (
                    <TypingAnimation
                        className="text-lg font-medium text-foreground/80"
                        onComplete={handleAnimationComplete}
                    >
                        {t('downloads.empty') || "No downloads yet"}
                    </TypingAnimation>
                ) : (
                    t('downloads.empty') || "No downloads yet"
                )}
            </h3>

            <div className={`transition-opacity duration-500 ${showSubtext ? 'opacity-100' : 'opacity-0'}`}>
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
