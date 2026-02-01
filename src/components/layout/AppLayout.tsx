import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Background } from "../providers/Background";
import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store";

interface AppLayoutProps {
  children: ReactNode;
  isOffline: boolean;
}

export function AppLayout({ children, isOffline }: AppLayoutProps) {
  const { t } = useTranslation();
  const { settings } = useAppStore();

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

  // Offline Banner Logic
  // Static: Show when offline, Hide when online
  const showBanner = isOffline;

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
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <WifiOff className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{t("status.offline")}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YT-DLP UPDATE AVAILABLE BANNER (Info Only) */}


      {/* Content Container - Ensure above background */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
