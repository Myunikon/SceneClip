import { useRef, forwardRef, useImperativeHandle, useState } from 'react'
import {
    Rocket, Scissors, Terminal, AlertTriangle,
    BookOpen, MousePointerClick, CheckCircle2,
    Clipboard, Settings
} from 'lucide-react'

import { useTranslation, Trans } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

export interface GuideModalRef {
    showModal: () => void
    close: () => void
}

type GuideSection = 'start' | 'clipping' | 'advanced' | 'faq'

export const GuideModal = forwardRef<GuideModalRef, unknown>((_, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const { t } = useTranslation()
    const [activeSection, setActiveSection] = useState<GuideSection>('start')

    useImperativeHandle(ref, () => ({
        showModal: () => dialogRef.current?.showModal(),
        close: () => dialogRef.current?.close()
    }))

    // Data Konten Panduan
    const sections = [
        { id: 'start', label: t('guide.menu.start') || "Getting Started", icon: Rocket },
        { id: 'clipping', label: t('guide.menu.clip') || "Clipping", icon: Scissors },
        { id: 'advanced', label: t('guide.menu.advanced') || "Advanced", icon: Terminal },
        { id: 'faq', label: t('guide.menu.faq') || "FAQ", icon: AlertTriangle },
    ]

    return (
        <dialog
            ref={dialogRef}
            className="fixed inset-0 m-auto bg-transparent p-0 backdrop:bg-black/80 w-full max-w-4xl h-[600px] rounded-2xl shadow-2xl open:animate-in open:fade-in open:zoom-in-95 backdrop:animate-in backdrop:fade-in outline-none"
            onClick={(e) => {
                if (e.target === dialogRef.current) dialogRef.current.close()
            }}
        >
            <div className="flex h-full bg-background/95 backdrop-blur-xl text-foreground rounded-2xl overflow-hidden border border-white/10 glass-panel">

                {/* --- LEFT SIDEBAR --- */}
                <div className="w-64 bg-secondary/30 border-r border-white/5 flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-bold text-sm">{t('guide_content.help_center')}</h2>
                                <p className="text-xs text-muted-foreground">SceneClip v1.0</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id as GuideSection)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                    activeSection === section.id
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <section.icon className="w-4 h-4" />
                                {section.label}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={() => dialogRef.current?.close()}
                            className="w-full py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-bold transition-colors"
                        >
                            {t('guide.sections.got_it') || "Close Guide"}
                        </button>
                    </div>
                </div>

                {/* --- RIGHT CONTENT AREA --- */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {/* RENDER CONTENT BASED ON ACTIVE SECTION */}
                            {activeSection === 'start' && <GettingStartedContent t={t} />}
                            {activeSection === 'clipping' && <ClippingContent t={t} />}
                            {activeSection === 'advanced' && <AdvancedContent t={t} />}
                            {activeSection === 'faq' && <FaqContent t={t} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </dialog>
    )
})

GuideModal.displayName = "GuideModal"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GettingStartedContent({ t }: { t: any }) {
    return (
        <div className="space-y-6">
            <header className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-orange-500" /> {t('guide.menu.start')}
                </h1>
                <p className="text-muted-foreground">{t('guide.subtitle')}</p>
            </header>

            <div className="grid gap-6">
                <StepItem
                    num="1"
                    title={t('guide.steps.smart.title') || "Smart Detection"}
                    desc={t('guide.steps.smart.desc')}
                    icon={<Clipboard className="w-5 h-5" />}
                />
                <StepItem
                    num="2"
                    title={t('guide.steps.format.title') || "Format Selection"}
                    desc={t('guide.steps.format.desc')}
                    icon={<Settings className="w-5 h-5" />}
                />
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex gap-3">
                <MousePointerClick className="w-5 h-5 text-orange-400 shrink-0" />
                <div>
                    <h4 className="text-sm font-bold text-orange-400">{t('guide_content.pro_tip_title')}</h4>
                    <p className="text-xs text-muted-foreground">
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
        <div className="space-y-6">
            <header className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Scissors className="w-6 h-6 text-orange-500" /> {t('guide.steps.clip.title')}
                </h1>
                <p className="text-muted-foreground">{t('guide.steps.clip.desc')}</p>
            </header>

            <div className="space-y-4">
                <div className="p-4 bg-secondary/30 rounded-xl space-y-3">
                    <h3 className="font-bold">{t('guide_content.how_to_use')}</h3>
                    <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
                        <li><Trans i18nKey="guide_content.clip_step1" components={{ strong: <strong /> }} /></li>
                        <li>{t('guide_content.clip_step2')}</li>
                        <li><Trans i18nKey="guide_content.clip_step3" components={{ strong: <strong /> }} /></li>
                        <li>{t('guide_content.clip_step4')}</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdvancedContent({ t }: { t: any }) {
    return (
        <div className="space-y-6">
            <header className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Terminal className="w-6 h-6 text-red-500" /> {t('guide.steps.terminal.title')}
                </h1>
                <p className="text-muted-foreground">{t('guide.steps.terminal.desc')}</p>
            </header>

            <ul className="space-y-4">
                <FeatureRow
                    title={t('guide_content.term_logs_title')}
                    desc={t('guide_content.term_logs_desc')}
                />
                <FeatureRow
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
        <div className="space-y-6">
            <header className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-500" /> {t('guide.menu.faq')}
                </h1>
                <p className="text-muted-foreground">{t('guide.sections.troubleshoot')}</p>
            </header>

            <div className="space-y-4">
                <FaqItem
                    q={t('guide_content.faq_1_q')}
                    a={t('guide_content.faq_1_a')}
                />
                <FaqItem
                    q={t('guide_content.faq_2_q')}
                    a={t('guide_content.faq_2_a')}
                />
                <FaqItem
                    q={t('guide_content.faq_3_q')}
                    a={t('guide_content.faq_3_a')}
                />
            </div>
        </div>
    )
}

/* -------------------------- HELPER COMPONENTS -------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StepItem({ num, title, desc, icon }: { num: string, title: string, desc: string, icon?: any }) {
    return (
        <div className="flex gap-4 p-4 rounded-xl border border-white/5 bg-secondary/10">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                {icon || num}
            </div>
            <div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{desc}</p>
            </div>
        </div>
    )
}

function FeatureRow({ title, desc }: { title: string, desc: string }) {
    return (
        <li className="flex gap-3 items-start p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
            <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
                <strong className="block text-sm text-foreground">{title}</strong>
                <span className="text-xs text-muted-foreground">{desc}</span>
            </div>
        </li>
    )
}

function FaqItem({ q, a }: { q: string, a: string }) {
    return (
        <div className="border border-white/10 rounded-xl p-4 bg-red-500/5">
            <h4 className="font-bold text-red-400 text-sm mb-2">{q}</h4>
            <p className="text-sm text-muted-foreground">{a}</p>
        </div>
    )
}
