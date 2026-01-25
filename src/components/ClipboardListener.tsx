
import { useEffect, useState, useRef } from 'react'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Link as LinkIcon } from 'lucide-react'
import { translations } from '../lib/locales'
import { useAppStore } from '../store'
import { isValidVideoUrl } from '../lib/validators'

interface ClipboardListenerProps {
    onFound: (url: string) => void
}

export function ClipboardListener({ onFound }: ClipboardListenerProps) {
    const { settings } = useAppStore()
    const t = translations[settings.language as keyof typeof translations].monitor

    const [detectedUrl, setDetectedUrl] = useState<string | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const lastTextRef = useRef<string>('')
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const detectedUrlRef = useRef<string | null>(null)
    const isVisibleRef = useRef(false)

    // Keep refs in sync with state
    useEffect(() => { detectedUrlRef.current = detectedUrl }, [detectedUrl])
    useEffect(() => { isVisibleRef.current = isVisible }, [isVisible])

    useEffect(() => {
        const checkClipboard = async () => {
            try {
                const text = await readText()
                if (!text) return

                // SAFETY GUARD: Ignore massive text blocks (novels, code dumps)
                if (text.length > 500) return

                // Ignore if same as last check
                if (text === lastTextRef.current) return

                lastTextRef.current = text

                // Check if it's a video URL
                if (isValidVideoUrl(text)) {
                    // Ignore if we just detected this specific URL and user closed it
                    if (detectedUrlRef.current === text && !isVisibleRef.current) return

                    setDetectedUrl(text)
                    setIsVisible(true)

                    // Auto-hide after 10 seconds if no action
                    setTimeout(() => {
                        setIsVisible(false)
                    }, 10000)
                }
            } catch {
                // Clipboard permission denied or empty
            }
        }

        // Poll every 3 seconds
        intervalRef.current = setInterval(checkClipboard, 3000)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, []) // Only run once on mount

    const handleDownload = () => {
        if (detectedUrl) {
            onFound(detectedUrl)
            setIsVisible(false)
            setDetectedUrl(null)
        }
    }

    const handleIgnore = () => {
        setIsVisible(false)
    }

    return (
        <AnimatePresence>
            {isVisible && detectedUrl && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-[60] max-w-sm w-full"
                >
                    <div className="bg-card/95 backdrop-blur border border-primary/20 p-4 rounded-xl shadow-2xl flex flex-col gap-3 relative overflow-hidden group">
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:animate-shimmer z-0 pointer-events-none"></div>

                        <div className="flex items-start gap-4 z-10">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 animate-bounce-slow">
                                <LinkIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm flex items-center gap-2">
                                    {t.title}
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 will-change-transform"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                </h4>
                                <p className="text-xs text-muted-foreground truncate opacity-80 font-mono mt-0.5">{detectedUrl}</p>
                            </div>
                            <button onClick={handleIgnore} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex gap-2 z-10">
                            <button
                                onClick={handleIgnore}
                                className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                            >
                                {t.ignore}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                            >
                                <Download className="w-3 h-3" />
                                {t.download}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
