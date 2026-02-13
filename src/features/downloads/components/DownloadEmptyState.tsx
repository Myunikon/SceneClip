import { Download } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { TypingAnimation } from '@/registry/magicui/typing-animation'
import { getShortcutSymbol } from '@/lib/platform'

export function DownloadEmptyState() {
    const { t } = useTranslation()
    const MOD = getShortcutSymbol()

    // Unified Typography & Styles
    const TEXT_CLASSES = "text-xl font-bold bg-clip-text text-transparent bg-foreground tracking-tight drop-shadow-sm select-none"
    const SUBTEXT_CLASSES = "text-sm text-muted-foreground/60 max-w-xs mx-auto leading-relaxed"

    // State to track if animation should play - initialize lazy to avoid flicker
    const [shouldAnimate, setShouldAnimate] = useState(() => {
        try {
            return !sessionStorage.getItem("emptyStatePlayed")
        } catch {
            return true // Fallback to playing animation if storage fails
        }
    })

    // Subtext visibility: Show immediately if NOT animating, otherwise wait for complete
    const [showDescription, setShowDescription] = useState(!shouldAnimate)

    const handleAnimationComplete = () => {
        setShouldAnimate(false)
        setShowDescription(true)
        try {
            sessionStorage.setItem("emptyStatePlayed", "true")
        } catch (e) {
            console.warn("Failed to save empty state preference", e)
        }
    }

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-transparent text-center select-none overflow-hidden relative">

            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                    duration: 0.4,
                    ease: [0.23, 1, 0.32, 1], // "Quart" ease-out for snappy feel
                    delay: 0.1
                }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Modern Icon with Subtle Gradient */}
                <div className="mb-6 p-4 rounded-3xl bg-gradient-to-br from-secondary/50 to-secondary/10 border border-white/5 shadow-inner">
                    <Download className="w-12 h-12 text-primary/80" strokeWidth={1.5} />
                </div>

                {/* Gradient Text Header with Typing Animation */}
                <h3 className="mb-3 min-h-[28px]">
                    {shouldAnimate ? (
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
                    )}
                </h3>

                {/* Description with Shortcut - Staggered Appearance */}
                <motion.div
                    className="min-h-[24px] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showDescription ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <p className={SUBTEXT_CLASSES}>
                        <Trans
                            i18nKey="empty_state.description"
                            defaults="Copy a link and press <1>{{mod}}+N</1> to start."
                            values={{ mod: MOD }}
                            components={{
                                1: <span className="font-semibold text-foreground/80 bg-secondary/50 px-1.5 py-0.5 rounded text-xs mx-1 align-baseline border border-white/10" />
                            }}
                        />
                    </p>
                </motion.div>
            </motion.div>
        </div>
    )
}
