
import { useRef, forwardRef, useImperativeHandle, useState } from 'react'
import { 
    Rocket, Scissors, Zap, Terminal, AlertTriangle, 
    BookOpen, MousePointerClick, CheckCircle2, 
    Clipboard, Settings 
} from 'lucide-react'
import { useAppStore } from '../store'
import { translations } from '../lib/locales'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'

export interface GuideModalRef {
    showModal: () => void
    close: () => void
}

type GuideSection = 'start' | 'clipping' | 'performance' | 'advanced' | 'faq'

export const GuideModal = forwardRef<GuideModalRef, {}>((_, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const { settings } = useAppStore()
    const t = translations[settings.language as keyof typeof translations] || translations.en
    const [activeSection, setActiveSection] = useState<GuideSection>('start')

    useImperativeHandle(ref, () => ({
        showModal: () => dialogRef.current?.showModal(),
        close: () => dialogRef.current?.close()
    }))

    // Data Konten Panduan
    const sections = [
        { id: 'start', label: t.guide.menu?.start || "Getting Started", icon: Rocket },
        { id: 'clipping', label: t.guide.menu?.clip || "Clipping", icon: Scissors },
        { id: 'performance', label: t.guide.menu?.perf || "Performance", icon: Zap },
        { id: 'advanced', label: t.guide.menu?.advanced || "Advanced", icon: Terminal },
        { id: 'faq', label: t.guide.menu?.faq || "FAQ", icon: AlertTriangle },
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
                                <h2 className="font-bold text-sm">Help Center</h2>
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
                            {t.guide.sections.got_it || "Close Guide"}
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
                            {activeSection === 'performance' && <PerformanceContent t={t} />}
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


function GettingStartedContent({ t }: { t: any }) {
    return (
        <div className="space-y-6">
            <header className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-blue-500" /> {t.guide.menu?.start}
                </h1>
                <p className="text-muted-foreground">{t.guide.subtitle}</p>
            </header>

            <div className="grid gap-6">
                <StepItem 
                    num="1" 
                    title={t.guide.steps?.smart?.title || "Smart Detection"}
                    desc={t.guide.steps?.smart?.desc}
                    icon={<Clipboard className="w-5 h-5" />}
                />
                <StepItem 
                    num="2" 
                    title={t.guide.steps?.format?.title || "Format Selection"} 
                    desc={t.guide.steps?.format?.desc}
                    icon={<Settings className="w-5 h-5" />}
                />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
                <MousePointerClick className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-400">Pro Tip: Drag & Drop</h4>
                    <p className="text-xs text-muted-foreground">
                        Drag any .txt file containing links into the app to start a batch download instantly.
                    </p>
                </div>
            </div>
        </div>
    )
}

function ClippingContent({ t }: { t: any }) {
    return (
        <div className="space-y-6">
            <header className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Scissors className="w-6 h-6 text-orange-500" /> {t.guide.steps?.clip?.title}
                </h1>
                <p className="text-muted-foreground">{t.guide.steps?.clip?.desc}</p>
            </header>

            <div className="space-y-4">
                <div className="p-4 bg-secondary/30 rounded-xl space-y-3">
                    <h3 className="font-bold">How to Use:</h3>
                    <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
                        <li>Toggle <strong>"Clip Mode"</strong> (Scissors icon).</li>
                        <li>Wait for metadata to load capability.</li>
                        <li>Drag the <strong>Range Slider</strong> to pick start/end points.</li>
                        <li>GIF format is available for short clips.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

function PerformanceContent({ t }: { t: any }) {
    return (
        <div className="space-y-6">
            <header className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-500" /> {t.guide.steps?.perf?.title}
                </h1>
                <p className="text-muted-foreground">{t.guide.steps?.perf?.desc}</p>
            </header>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-white/10 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-yellow-500 font-bold">
                        <Zap className="w-4 h-4" /> Low Performance Mode
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Disables animations and glass effects. Recommended for laptops running on battery or without dedicated GPUs.
                    </p>
                </div>

                <div className="p-4 border border-white/10 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                        <Rocket className="w-4 h-4" /> Hardware Acceleration
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        SceneClip auto-detects NVIDIA/AMD/Intel GPUs to speed up video conversion and reduce CPU load.
                    </p>
                </div>
            </div>
        </div>
    )
}

function AdvancedContent({ t }: { t: any }) {
    return (
        <div className="space-y-6">
            <header className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Terminal className="w-6 h-6 text-purple-500" /> {t.guide.steps?.terminal?.title}
                </h1>
                <p className="text-muted-foreground">{t.guide.steps?.terminal?.desc}</p>
            </header>

            <ul className="space-y-4">
                <FeatureRow 
                    title="Terminal Logs"
                    desc="View raw output from yt-dlp and FFmpeg. Essential for debugging errors."
                />
                <FeatureRow 
                    title="Browser Cookies"
                    desc="Download Age-Restricted content by using cookies from your browser (Chrome/Firefox)."
                />
            </ul>
        </div>
    )
}

function FaqContent({ t }: { t: any }) {
    return (
        <div className="space-y-6">
            <header className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-500" /> {t.guide.menu?.faq}
                </h1>
                <p className="text-muted-foreground">{t.guide.sections?.troubleshoot}</p>
            </header>

            <div className="space-y-4">
                <FaqItem 
                    q="Download stuck at 100%?" 
                    a="The app is likely merging video and audio streams. This can take a while for large files (4K/8K)." 
                />
                <FaqItem 
                    q="Sign in to confirm your age?" 
                    a="Go to Settings > Advanced > Source and select your browser to use its cookies." 
                />
                <FaqItem 
                    q="Slow download speed?" 
                    a="Try changing 'Connection Type' in Network Settings to 'Aggressive'. Warning: May cause temporary IP bans." 
                />
            </div>
        </div>
    )
}

/* -------------------------- HELPER COMPONENTS -------------------------- */

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
            <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
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
