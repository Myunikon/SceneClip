
import { useRef, useEffect, useState } from 'react'
import {
    Rocket, Scissors, Terminal, AlertTriangle,
    BookOpen, MousePointerClick, CheckCircle2,
    X
} from 'lucide-react'

import { useTranslation, Trans } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

interface GuideModalProps {
    isOpen: boolean
    onClose: () => void
}

type GuideSection = 'start' | 'clipping' | 'advanced' | 'faq'

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const { t } = useTranslation()
    const popoverRef = useRef<HTMLDivElement>(null)
    const [activeSection, setActiveSection] = useState<GuideSection>('start')

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                // Check if click was on the trigger button (handled by parent usually, but safe to ignore)
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    // Close on Esc
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEsc)
        }
        return () => document.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])


    const sections = [
        { id: 'start', label: t('guide.menu.start') || "Start", icon: Rocket },
        { id: 'clipping', label: t('guide.menu.clip') || "Clip", icon: Scissors },
        { id: 'advanced', label: t('guide.menu.advanced') || "Adv", icon: Terminal },
        { id: 'faq', label: t('guide.menu.faq') || "FAQ", icon: AlertTriangle },
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-14 right-24 z-50 w-80 max-h-[80vh] flex flex-col bg-background/95 backdrop-blur-2xl border border-border/50 rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-border/10 bg-secondary/20 shrink-0">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">{t('guide.title')}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-secondary rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex p-1 gap-1 bg-secondary/10 border-b border-border/10 shrink-0 overflow-x-auto no-scrollbar">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id as GuideSection)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                                    activeSection === section.id
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <section.icon className="w-3 h-3" />
                                <span>{section.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, x: 5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -5 }}
                                transition={{ duration: 0.15 }}
                            >
                                {activeSection === 'start' && <GettingStartedContent t={t} />}
                                {activeSection === 'clipping' && <ClippingContent t={t} />}
                                {activeSection === 'advanced' && <AdvancedContent t={t} />}
                                {activeSection === 'faq' && <FaqContent t={t} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Compact Content Components

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GettingStartedContent({ t }: { t: any }) {
    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h4 className="font-bold text-sm">{t('guide.subtitle')}</h4>
                <p className="text-xs text-muted-foreground">Quick setup guide.</p>
            </div>

            <div className="space-y-3">
                <CompactStepItem
                    num="1"
                    title={t('guide.steps.smart.title')}
                    desc={t('guide.steps.smart.desc')}
                />
                <CompactStepItem
                    num="2"
                    title={t('guide.steps.format.title')}
                    desc={t('guide.steps.format.desc')}
                />
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg flex gap-2">
                <MousePointerClick className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                    <h5 className="text-xs font-bold text-orange-400">{t('guide_content.pro_tip_title')}</h5>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5">
                        {t('guide_content.pro_tip_desc')}
                    </p>
                </div>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ClippingContent({ t }: { t: any }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <Scissors className="w-4 h-4 text-orange-500" />
                <h4 className="font-bold text-sm">{t('guide.steps.clip.title')}</h4>
            </div>

            <ul className="space-y-2">
                <li className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/20">
                    <Trans i18nKey="guide_content.clip_step1" components={{ strong: <strong className="text-foreground" /> }} />
                </li>
                <li className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/20">
                    {t('guide_content.clip_step2')}
                </li>
                <li className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/20">
                    <Trans i18nKey="guide_content.clip_step3" components={{ strong: <strong className="text-foreground" /> }} />
                </li>
            </ul>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdvancedContent({ t }: { t: any }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-red-500" />
                <h4 className="font-bold text-sm">{t('guide.steps.terminal.title')}</h4>
            </div>
            <ul className="space-y-2">
                <CompactFeatureRow
                    title={t('guide_content.term_logs_title')}
                    desc={t('guide_content.term_logs_desc')}
                />
                <CompactFeatureRow
                    title={t('guide_content.cookies_title')}
                    desc={t('guide_content.cookies_desc')}
                />
            </ul>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FaqContent({ t }: { t: any }) {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="border border-border/10 rounded-lg p-2.5 bg-secondary/5">
                    <h5 className="font-semibold text-xs text-foreground mb-1">{t(`guide_content.faq_${i}_q`)}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t(`guide_content.faq_${i}_a`)}</p>
                </div>
            ))}
        </div>
    )
}

/* -------------------------- HELPERS -------------------------- */

function CompactStepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
    return (
        <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">
                {num}
            </div>
            <div>
                <strong className="block text-xs text-foreground">{title}</strong>
                <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
            </div>
        </div>
    )
}

function CompactFeatureRow({ title, desc }: { title: string, desc: string }) {
    return (
        <li className="flex gap-2 items-start p-2 rounded hover:bg-secondary/10 border border-transparent hover:border-border/10 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <div>
                <strong className="block text-xs text-foreground">{title}</strong>
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{desc}</span>
            </div>
        </li>
    )
}
