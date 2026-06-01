import { Download } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'
import { useState } from 'react'
import { TypingAnimation } from '@/registry/magicui/typing-animation'
import { getShortcutSymbol } from '@/lib/platform'
import { EmptyState } from '@/components/ui'

export function DownloadEmptyState() {
    const { t } = useTranslation()
    const MOD = getShortcutSymbol()

    const TEXT_CLASSES = "text-xl font-bold bg-clip-text text-transparent bg-foreground tracking-tight drop-shadow-sm select-none"

    // State to track if animation should play
    const [shouldAnimate, setShouldAnimate] = useState(() => {
        try {
            return !sessionStorage.getItem("emptyStatePlayed")
        } catch {
            return true
        }
    })

    const handleAnimationComplete = () => {
        setShouldAnimate(false)
        try {
            sessionStorage.setItem("emptyStatePlayed", "true")
        } catch (e) {
            console.warn("Failed to save empty state preference", e)
        }
    }

    const titleElement = shouldAnimate ? (
        <TypingAnimation
            className={TEXT_CLASSES}
            onComplete={handleAnimationComplete}
            duration={50}
        >
            {t('downloads.empty') || "No downloads yet"}
        </TypingAnimation>
    ) : (
        <span className={TEXT_CLASSES}>
            {t('downloads.empty') || "No downloads yet"}
        </span>
    )

    const descriptionElement = (
        <Trans
            i18nKey="empty_state.description"
            defaults="Copy a link and press <1>{{mod}}+N</1> to start."
            values={{ mod: MOD }}
            components={{
                1: <span className="font-semibold text-foreground/80 bg-secondary/50 px-1.5 py-0.5 rounded text-xs mx-1 align-baseline border border-white/10" />
            }}
        />
    )

    return (
        <EmptyState
            icon={<Download className="w-12 h-12" strokeWidth={1.5} />}
            title={t('downloads.empty') || "No downloads yet"}
            description={descriptionElement}
            // Overriding title element for typing animation
            action={shouldAnimate ? titleElement : undefined}
        />
    )
}
