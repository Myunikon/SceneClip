import { useState } from 'react'
import { Rocket, Download, FolderOpen, Zap, CheckCircle2, ChevronRight, X } from 'lucide-react'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'

export function Onboarding() {
    const { settings, setSetting } = useAppStore()
    const [step, setStep] = useState(0)

    if (settings.hasSeenOnboarding) return null

    const steps = [
        {
            title: "Welcome to ClipSceneYT!",
            desc: "Your ultimate video downloader has arrived. Let's take a quick tour to get you started.",
            icon: Rocket,
            color: "text-primary"
        },
        {
            title: "Easy Downloads",
            desc: "Just copy any YouTube URL and click the (+) button. We'll handle the rest - formats, metadata, and more.",
            icon: Download,
            color: "text-blue-500"
        },
        {
            title: "Queue & History",
            desc: "Active downloads live in the 'Downloads' tab. \nOnce finished, find them in 'History' where you can play or open them instantly.",
            icon: FolderOpen,
            color: "text-orange-500"
        },
        {
            title: "Turbo Mode & Clips",
            desc: "Need speed? Enable 'Turbo Mode' in settings (requires aria2c). \nNeed just a part? Use the 'Clip Range' feature to cut videos precisely.",
            icon: Zap,
            color: "text-yellow-500"
        },
        {
            title: "You're All Set!",
            desc: "Explore the Settings for themes 🌙 and language options 🌏. \nHappy downloading!",
            icon: CheckCircle2,
            color: "text-green-500"
        }
    ]

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1)
        } else {
            setSetting('hasSeenOnboarding', true)
        }
    }

    const current = steps[step]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card w-[500px] rounded-2xl border shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button 
                    onClick={() => setSetting('hasSeenOnboarding', true)}
                    className="absolute top-4 right-4 p-2 hover:bg-secondary/50 rounded-full text-muted-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-8 pb-0 flex-1 flex flex-col items-center text-center">
                    <div className={cn("w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 shadow-inner", current.color)}>
                        <current.icon className="w-10 h-10" />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-3 tracking-tight">{current.title}</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line max-w-[350px]">
                        {current.desc}
                    </p>
                </div>

                {/* Footer / Navigation */}
                <div className="p-8 mt-4 flex items-center justify-between">
                    {/* Dots */}
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    i === step ? "bg-primary w-6" : "bg-primary/20"
                                )}
                            />
                        ))}
                    </div>

                    <button 
                        onClick={handleNext}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/25"
                    >
                        {step === steps.length - 1 ? "Get Started" : "Next"}
                        {step !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
