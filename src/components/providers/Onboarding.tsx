// import { useCallback } from "react";
import { Zap, Scissors, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "../../store";
import { cn } from "../../lib/utils";

export function Onboarding() {
  const { settings, setSetting } = useAppStore();

  const handleStart = () => {
    setSetting("hasSeenOnboarding", true);
  };

  // Escape Hatch: ?reset-onboarding=true
  const forceShow = typeof window !== 'undefined' && window.location.search.includes('reset-onboarding')

  if (settings.hasSeenOnboarding && !forceShow) return null;

  const FEATURES = [
    {
      icon: Zap,
      title: "Smart Detection",
      desc: "Auto-detects video links from your clipboard.",
      color: "text-blue-500", // Standard Apple Blue
    },
    {
      icon: Scissors,
      title: "Precision Clipping",
      desc: "Download only the best parts to save space.",
      color: "text-blue-500",
    },
    {
      icon: ShieldCheck,
      title: "Secure Keyring",
      desc: "Safe storage for your premium account credentials.",
      color: "text-blue-500",
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      {/*  */}
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-background/95 border border-black/5 dark:border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center text-center pb-8 pt-10"
      >

        {/* Minimal Header (No big icon, just Title) */}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
          Welcome to SceneClip
        </h1>
        <p className="text-muted-foreground text-[15px] max-w-xs mx-auto mb-8">
          The ultimate tool for downloading and clipping videos from the web.
        </p>

        {/* Feature List (Left Aligned within center container) */}
        <div className="w-full px-8 space-y-6 mb-8 text-left">
          {FEATURES.map((feat, i) => (
            <div key={i} className="flex gap-4 items-start">
              {/* Simple Icon (No background box) */}
              <feat.icon className={cn("w-7 h-7 mt-0.5 shrink-0", feat.color)} strokeWidth={1.5} />

              <div className="space-y-0.5">
                <h3 className="font-semibold text-[15px] text-foreground">{feat.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-snug">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action (Simple Blue Button) */}
        <div className="w-full px-8">
          <button
            onClick={handleStart}
            className="w-full py-2.5 rounded-[10px] bg-blue-600 text-white font-medium text-[15px] hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
          >
            Get Started
          </button>
        </div>

      </motion.div>
    </div>
  );
}