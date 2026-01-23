import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Background } from "../Background";
import { WifiOff, AlertTriangle } from "lucide-react";
import { translations } from "../../lib/locales";
import { useAppStore } from "../../store";

interface AppLayoutProps {
  children: ReactNode;
  isOffline: boolean;
  language: string;
}

export function AppLayout({ children, isOffline, language }: AppLayoutProps) {
  // Determine translation for "Offline"
  const t =
    translations[language as keyof typeof translations] || translations["en"];
  const { ytdlpNeedsUpdate, ytdlpLatestVersion, settings } = useAppStore();

  // Handle Global Font Scale
  useEffect(() => {
    const root = document.documentElement;
    const sizeMap: Record<string, string> = {
      small: "14px",
      medium: "16px",
      large: "18px", // Slightly less aggressive than 20px to avoid breaking layout too much
    };
    root.style.fontSize =
      sizeMap[settings.frontendFontSize || "medium"] || "16px";
  }, [settings.frontendFontSize]);

  // Offline Banner Cycle Logic
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOffline) {
      setShowBanner(false);
      return;
    }

    // Initial Show
    setShowBanner(true);

    // Cycle: Show 10s -> Hide 30s -> Repeat
    // We need a loop.
    let isActive = true;

    const runCycle = async () => {
      while (isActive) {
        setShowBanner(true);
        await new Promise((r) => setTimeout(r, 10000)); // Show for 10s
        if (!isActive) break;

        setShowBanner(false);
        await new Promise((r) => setTimeout(r, 30000)); // Hide for 30s
      }
    };

    runCycle();

    return () => {
      isActive = false;
    };
  }, [isOffline]);

  return (
    <div className="h-screen w-full flex flex-col text-foreground font-sans overflow-hidden selection:bg-primary/30 relative">
      <Background />

      {/* Animated Offline Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-14 inset-x-0 z-50 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-red-500/30 shadow-[0_8px_30px_rgb(239,68,68,0.24)] text-red-600 dark:text-red-400 font-medium text-sm">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <WifiOff className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{t.status.offline}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YT-DLP UPDATE AVAILABLE BANNER (Info Only) */}
      {ytdlpNeedsUpdate && !isOffline && (
        <div className="absolute top-16 left-0 right-0 z-40 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>
            {t.updater_banner.update_available}{" "}
            <strong>{ytdlpLatestVersion}</strong>
          </span>
          <span className="text-muted-foreground/70">
            (Manual update required)
          </span>
        </div>
      )}

      {/* Content Container - Ensure above background */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
