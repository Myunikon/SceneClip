import { useState, useEffect, useCallback } from "react";
import { Rocket, Download, FolderOpen, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../store";
import { cn } from "../lib/utils";

// STEPS dipindah ke dalam komponen untuk akses 't'
import { useTranslation } from "react-i18next";

export function Onboarding() {
  const { settings, setSetting } = useAppStore();
  const [step, setStep] = useState(0);
  const { t } = useTranslation();

  const STEPS = [
    {
      title: t('onboarding.step1_title'),
      desc: t('onboarding.step1_desc'),
      icon: Rocket,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: t('onboarding.step2_title'),
      desc: t('onboarding.step2_desc'),
      icon: Download,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: t('onboarding.step3_title'),
      desc: t('onboarding.step3_desc'),
      icon: FolderOpen,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: t('onboarding.step4_title'),
      desc: t('onboarding.step4_desc'),
      icon: Zap,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      title: t('onboarding.step5_title'),
      desc: t('onboarding.step5_desc'),
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  const finishOnboarding = useCallback(() => setSetting("hasSeenOnboarding", true), [setSetting]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  }, [step, STEPS.length, finishOnboarding]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft" && step > 0) setStep(s => s - 1);
      if (e.key === "Escape") finishOnboarding();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, handleNext, finishOnboarding]);

  if (settings.hasSeenOnboarding) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden relative"
      >
        {/* Skip Button (UX Improvement) */}
        <button
          onClick={finishOnboarding}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xs font-medium px-3 py-1 rounded-full hover:bg-secondary transition-colors z-10"
        >
          {t('onboarding.skip')}
        </button>

        <div className="p-8 pb-6 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              {/* Simplified Icon */}
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", current.bg)}>
                <current.icon className={cn("w-8 h-8", current.color)} />
              </div>

              <h2 className="text-xl font-bold mb-3 text-foreground">{current.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed h-12">
                {current.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-2 flex flex-col gap-6">
          {/* Progress Indicator */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
                )}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {step === STEPS.length - 1 ? t('onboarding.start') : t('onboarding.continue')}
            {step !== STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}