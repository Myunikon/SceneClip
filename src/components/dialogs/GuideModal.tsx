import { useRef, useEffect, useState } from 'react'
import { BookOpen, ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

interface GuideModalProps {
    isOpen: boolean
    onClose: () => void
}

type GuideSection = 'overview' | 'features' | 'advanced' | 'troubleshooting'

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const { t } = useTranslation()
    const popoverRef = useRef<HTMLDivElement>(null)
    const [currentView, setCurrentView] = useState<GuideSection | null>(null)

    // Reset view when closed
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => setCurrentView(null), 200)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    // Close on Esc (Global)
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (currentView) {
                    // If in detail view, go back
                    e.stopPropagation()
                    setCurrentView(null)
                } else {
                    // If in root, close modal
                    onClose()
                }
            }
            if (e.key === 'Backspace' && currentView) {
                // Backspace goes back from detail view
                setCurrentView(null)
            }
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEsc)
        }
        return () => document.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose, currentView])

    const sections = [
        {
            id: 'overview',
            label: t('guide.sections.overview'),
            desc: t('guide.sections.overview_desc')
        },
        {
            id: 'features',
            label: t('guide.sections.features'),
            desc: t('guide.sections.features_desc')
        },
        {
            id: 'advanced',
            label: t('guide.sections.advanced'),
            desc: t('guide.sections.advanced_desc')
        },

        {
            id: 'troubleshooting',
            label: t('guide.sections.troubleshooting'),
            desc: t('guide.sections.troubleshooting_desc')
        },
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="guide-modal-content"
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.95, y: -8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, y: -8, filter: "blur(4px)" }}
                    transition={{
                        opacity: { duration: 0.2 },
                        filter: { duration: 0.2 },
                        default: { type: "spring", stiffness: 260, damping: 20 }
                    }}
                    style={{ transformOrigin: "top right" }}
                    className="absolute top-14 right-12 z-50 w-80 max-h-[500px] flex flex-col bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {currentView === null ? (
                            <motion.div
                                key="root"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col h-full"
                            >
                                <div className="flex flex-col p-2 space-y-1">
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70">Topics</div>
                                    <ul className="space-y-1">
                                        {sections.map((section) => (
                                            <li
                                                key={section.id}
                                                onClick={() => setCurrentView(section.id as GuideSection)}
                                                className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-secondary/50 group transition-colors"
                                            >
                                                <BookOpen className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{section.label}</span>
                                                    <span className="text-[10px] text-muted-foreground">{section.desc}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="h-px bg-border/40 my-1 mx-2" />
                                    <a
                                        href="https://github.com/Myunikon/SceneClip/issues"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                                    >
                                        <span className="text-xs">{t('guide.content.troubleshooting.report_btn')}</span>
                                    </a>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="detail"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col h-full max-h-[500px]"
                            >
                                {/* Detail Header */}
                                <div className="flex items-center gap-2 p-2 border-b border-border/10 bg-secondary/10 shrink-0">
                                    <button
                                        onClick={() => setCurrentView(null)}
                                        className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-semibold capitalize">
                                        {sections.find(s => s.id === currentView)?.label}
                                    </span>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {currentView === 'overview' && <OverviewContent t={t} />}
                                    {currentView === 'features' && <FeaturesContent t={t} />}
                                    {currentView === 'advanced' && <AdvancedContent t={t} />}


                                    {currentView === 'troubleshooting' && <TroubleshootingContent t={t} />}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Compact Content Components

function OverviewContent({ t }: { t: any }) {
    return (
        <div className="space-y-5">

            <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground">{t('guide.content.overview.title')}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('guide.content.overview.desc')}
                </p>
            </div>

            <div className="space-y-3">
                <div className="text-xs font-semibold text-foreground/80">{t('guide.content.overview.smart_workflow')}</div>
                <div className="grid gap-3">
                    <CompactStepItem num="1" title={t('guide.content.overview.steps.s1_title')} desc={t('guide.content.overview.steps.s1_desc')} />
                    <CompactStepItem num="2" title={t('guide.content.overview.steps.s2_title')} desc={t('guide.content.overview.steps.s2_desc')} />
                    <CompactStepItem num="3" title={t('guide.content.overview.steps.s3_title')} desc={t('guide.content.overview.steps.s3_desc')} />
                </div>
            </div>

            <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground">{t('guide.content.overview.formats.title')}</h5>
                <ul className="text-xs text-muted-foreground space-y-1 ml-1">
                    <li><strong className="text-foreground">{t('guide.content.overview.formats.best')}</strong> {t('guide.content.overview.formats.best_desc')}</li>
                    <li><strong className="text-foreground">{t('guide.content.overview.formats.audio')}</strong> {t('guide.content.overview.formats.audio_desc')}</li>
                    <li><strong className="text-foreground">{t('guide.content.overview.formats.custom')}</strong> {t('guide.content.overview.formats.custom_desc')}</li>
                </ul>
            </div>

            <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg">
                <h5 className="text-xs font-bold text-foreground">{t('guide.content.overview.supported.title')}</h5>
                <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                    <strong>{t('guide.content.overview.supported.major')}</strong> {t('guide.content.overview.supported.major_list')}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                    <strong>{t('guide.content.overview.supported.streaming')}</strong> {t('guide.content.overview.supported.streaming_list')}
                </p>
                <a
                    href="https://github.com/Myunikon/SceneClip/blob/main/supportedsites.md"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                    {t('guide.content.overview.supported.full_list')} <BookOpen className="w-3 h-3" />
                </a>
            </div>
        </div>
    )
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FeaturesContent({ t }: { t: any }) {
    return (
        <div className="space-y-5">
            <div className="space-y-4">
                <FeatureBlock title={t('guide.content.features.clipping.title')} color="text-orange-500">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('guide.content.features.clipping.desc')}
                    </p>
                </FeatureBlock>

                <FeatureBlock title={t('guide.content.features.gif.title')} color="text-pink-500">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('guide.content.features.gif.desc')}
                    </p>
                </FeatureBlock>

                <FeatureBlock title={t('guide.content.features.keyring.title')} color="text-blue-500">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('guide.content.features.keyring.desc')}
                    </p>
                </FeatureBlock>

                <FeatureBlock title={t('guide.content.features.batch.title')} color="text-purple-500">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('guide.content.features.batch.desc') || "Queue multiple videos at once. Click the List Icon next to the URL bar to paste a list of links or import a .txt file."}
                    </p>
                </FeatureBlock>

                <FeatureBlock title={t('guide.content.features.scheduler.title')} color="text-cyan-500">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('guide.content.features.scheduler.desc')}
                    </p>
                </FeatureBlock>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdvancedContent({ t }: { t: any }) {
    return (
        <div className="space-y-5">
            <div className="space-y-3">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider opacity-70">{t('guide.content.advanced.enhancements')}</h4>
                <ul className="grid gap-2">
                    <CompactFeatureRow title={t('guide.content.advanced.items.sponsorblock')} desc={t('guide.content.advanced.items.sponsorblock_desc')} />
                    <CompactFeatureRow title={t('guide.content.advanced.items.embed_subs')} desc={t('guide.content.advanced.items.embed_subs_desc')} />
                    <CompactFeatureRow title={t('guide.content.advanced.items.loudness')} desc={t('guide.content.advanced.items.loudness_desc')} />
                    <CompactFeatureRow title={t('guide.content.advanced.items.postproc')} desc={t('guide.content.advanced.items.postproc_desc')} />
                </ul>
            </div>


            <div className="space-y-3">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider opacity-70">{t('guide.content.advanced.network')}</h4>
                <ul className="grid gap-2">
                    <CompactFeatureRow title={t('guide.content.advanced.items.aria2c')} desc={t('guide.content.advanced.items.aria2c_desc')} />
                    <CompactFeatureRow title={t('guide.content.advanced.items.cookies')} desc={t('guide.content.advanced.items.cookies_desc')} />
                    <CompactFeatureRow title={t('guide.content.advanced.items.gpu')} desc={t('guide.content.advanced.items.gpu_desc')} />
                </ul>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TroubleshootingContent({ t }: { t: any }) {
    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <TroubleshootItem title={t('guide.content.troubleshooting.stuck.title')}>
                    {t('guide.content.troubleshooting.stuck.desc')}
                </TroubleshootItem>
                <TroubleshootItem title={t('guide.content.troubleshooting.signin.title')}>
                    {t('guide.content.troubleshooting.signin.desc')}
                </TroubleshootItem>
                <TroubleshootItem title={t('guide.content.troubleshooting.permission.title')}>
                    {t('guide.content.troubleshooting.permission.desc')}
                </TroubleshootItem>
                <TroubleshootItem title={t('guide.content.troubleshooting.slow.title')}>
                    {t('guide.content.troubleshooting.slow.desc')}
                </TroubleshootItem>
                <TroubleshootItem title={t('guide.content.troubleshooting.geoblock.title')}>
                    {t('guide.content.troubleshooting.geoblock.desc')}
                </TroubleshootItem>
                <TroubleshootItem title={t('guide.content.troubleshooting.playlist.title')}>
                    {t('guide.content.troubleshooting.playlist.desc')}
                </TroubleshootItem>
            </div>

            <a href="https://github.com/Myunikon/SceneClip/issues" target="_blank" rel="noreferrer" className="block p-3 mt-2 bg-secondary/30 hover:bg-secondary/50 rounded-lg text-center transition-colors">
                <div className="text-xs font-semibold text-primary">{t('guide.content.troubleshooting.report_btn')}</div>
                <div className="text-[10px] text-muted-foreground">{t('guide.content.troubleshooting.report_desc')}</div>
            </a>
        </div>
    )
}

/* -------------------------- HELPERS -------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FeatureBlock({ title, children, color }: { title: string, children: React.ReactNode, color: string }) {
    return (
        <div className="flex gap-3">
            <div className={cn("w-1 h-8 rounded-full shrink-0", color.replace('text-', 'bg-'))} />
            <div>
                <h5 className="text-sm font-semibold text-foreground mb-1">{title}</h5>
                {children}
            </div>
        </div>
    )
}

function TroubleshootItem({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="border border-border/40 rounded-lg p-3 bg-secondary/5">
            <h5 className="font-semibold text-xs text-foreground mb-1">
                {title}
            </h5>
            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-2 ml-0.5">{children}</p>
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
        <li className="flex gap-3 items-start p-2 rounded hover:bg-secondary/10 border border-transparent hover:border-border/10 transition-colors">
            <div className="w-1 h-1 rounded-full bg-primary shrink-0 mt-1.5" />
            <div>
                <strong className="block text-xs text-foreground">{title}</strong>
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{desc}</span>
            </div>
        </li>
    )
}
