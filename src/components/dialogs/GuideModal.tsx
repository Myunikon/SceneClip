
import { useRef, useEffect, useState } from 'react'
import {
    BookOpen,
    X
} from 'lucide-react'

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
    const [activeSection, setActiveSection] = useState<GuideSection>('overview')

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
        { id: 'overview', label: "Overview" },
        { id: 'features', label: "Features" },
        { id: 'advanced', label: "Advanced" },
        { id: 'troubleshooting', label: "Fix Issues" },
    ]

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="absolute top-14 right-24 z-50 w-80 max-h-[80vh] flex flex-col bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5"
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

                    {/* Navigation Tabs (Scrollable Segmented Control) */}
                    <div className="border-b border-border/40 shrink-0">
                        <div className="overflow-x-auto custom-scrollbar py-2 px-3">
                            <div className="flex gap-1 p-1 bg-muted/40 rounded-lg relative isolate ring-1 ring-inset ring-black/5 dark:ring-white/5 w-max min-w-full">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id as GuideSection)}
                                        className={cn(
                                            "relative z-10 flex items-center justify-center py-1.5 px-4 rounded-md text-xs font-semibold transition-all duration-200 ease-out whitespace-nowrap shrink-0",
                                            activeSection === section.id
                                                ? "text-foreground"
                                                : "text-muted-foreground hover:text-foreground/70"
                                        )}
                                    >
                                        {activeSection === section.id && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute inset-0 bg-background rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:ring-white/5 z-[-1]"
                                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                            />
                                        )}
                                        <span>{section.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            >
                                {activeSection === 'overview' && <OverviewContent t={t} />}
                                {activeSection === 'features' && <FeaturesContent t={t} />}
                                {activeSection === 'advanced' && <AdvancedContent t={t} />}
                                {activeSection === 'troubleshooting' && <TroubleshootingContent t={t} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Compact Content Components

function OverviewContent({ t: _t }: { t: any }) {
    return (
        <div className="space-y-5">

            <div className="space-y-2">
                <h4 className="font-bold text-sm text-foreground">The Ultimate GUI for yt-dlp</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Download videos, extract audio, and create precise clips from thousands of sites without touching a terminal.
                </p>
            </div>

            <div className="space-y-3">
                <div className="text-xs font-semibold text-foreground/80">Smart Detection Workflow</div>
                <div className="grid gap-3">
                    <CompactStepItem num="1" title="Copy Link" desc="Copy any video URL from your browser (YouTube, Twitch, etc)." />
                    <CompactStepItem num="2" title="Auto-Detect" desc="SceneClip reads your clipboard and auto-pastes the link." />
                    <CompactStepItem num="3" title="Download" desc="One click for Best Quality. Use 'List' icon for batch mode." />
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg">
                <h5 className="text-xs font-bold text-foreground">Supported Platforms</h5>
                <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                    YouTube, Twitter (X), Instagram, TikTok, Twitch, SoundCloud, Bilibili, and thousands more.
                </p>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FeaturesContent({ t: _t }: { t: any }) {
    return (
        <div className="space-y-5">
            <div className="space-y-4">
                <FeatureBlock title="Clipping & Trimming" color="text-orange-500">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Download only what you need. Enable the <strong>Trim</strong> toggle, then set Start/End timestamps to extract a specific segment without downloading the full video.
                    </p>
                </FeatureBlock>

                <FeatureBlock title="GIF Maker" color="text-pink-500">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Turn any video segment into an optimized GIF. Select the <strong>GIF</strong> tab. Limit: 30 seconds max. Adjustable FPS and scale.
                    </p>
                </FeatureBlock>

                <FeatureBlock title="Keyring Manager" color="text-blue-500">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Securely store credentials for Premium/Age-gated content. Uses your OS native vault (Windows Credential Manager, macOS Keychain, or Linux Secret Service).
                    </p>
                </FeatureBlock>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdvancedContent({ t: _t }: { t: any }) {
    return (
        <div className="space-y-5">
            <div className="space-y-3">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider opacity-70">Enhancements</h4>
                <ul className="grid gap-2">
                    <CompactFeatureRow title="SponsorBlock" desc="Auto-skip sponsors, intros, and outros (YouTube only)." />
                    <CompactFeatureRow title="Embed Subtitles" desc="Merge Soft-Subs directly into the video file." />
                    <CompactFeatureRow title="Loudness Norm" desc="Normalize audio to EBU R128 broadcast standard." />
                </ul>
            </div>

            <div className="space-y-3">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider opacity-70">Network & System</h4>
                <ul className="grid gap-2">
                    <CompactFeatureRow title="Aria2c Accelerator" desc="Multi-threaded downloading for maximum speed." />
                    <CompactFeatureRow title="Cookies Import" desc="Use browser cookies to access Premium content." />
                    <CompactFeatureRow title="GPU Acceleration" desc="Hardware-accelerated transcoding for faster clips." />
                </ul>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TroubleshootingContent({ t: _t }: { t: any }) {
    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <TroubleshootItem title="Download Stuck at 100%?">
                    Processing large files (4K/8K) involves merging video+audio streams. This is normal and depends on your CPU speed. Please wait.
                </TroubleshootItem>
                <TroubleshootItem title="Sign in / Bot Check?">
                    YouTube may throttle bots. Go to <strong>Settings &gt; Network</strong> and enable <strong>PO Token</strong> or import browser cookies.
                </TroubleshootItem>
                <TroubleshootItem title="Permission Denied?">
                    Avoid saving to optimized system folders (e.g. <code>C:\Program Files</code> or <code>/usr/local</code>). Use your User Downloads or Documents folder. Check Security Software exclusions.
                </TroubleshootItem>
                <TroubleshootItem title="Slow Speeds?">
                    Try enabling <strong>Aria2c</strong> in Network Settings to force multi-connection downloading.
                </TroubleshootItem>
            </div>

            <a href="https://github.com/Myunikon/SceneClip/issues" target="_blank" rel="noreferrer" className="block p-3 mt-2 bg-secondary/30 hover:bg-secondary/50 rounded-lg text-center transition-colors">
                <div className="text-xs font-semibold text-primary">Report a Bug on GitHub</div>
                <div className="text-[10px] text-muted-foreground">Attach logs from the Terminal tab</div>
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
