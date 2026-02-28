import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Background } from "../providers/Background";
import { WifiOff, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

interface AppLayoutProps {
  children: ReactNode;
  isOffline: boolean;
}

export function AppLayout({ children, isOffline }: AppLayoutProps) {
  const { t } = useTranslation();
  const { settings, tasks } = useAppStore();
  const [showExitDialog, setShowExitDialog] = useState(false);

  // --- EXIT GUARD LOGIC ---
  // 1. Listen for backend "request-close-confirmation" event (Close Button)
  useEffect(() => {
    const unlisten = listen("request-close-confirmation", () => {
      setShowExitDialog(true);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  // 2. Prevent Refresh (F5 / Ctrl+R) if active downloads exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasActive = tasks.some((task) =>
        ["downloading", "fetching_info", "processing", "queued"].includes(
          task.status
        )
      );

      if (hasActive) {
        // Trigger browser's native "Reload site?" warning
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [tasks]);

  const handleConfirmExit = async () => {
    await invoke("force_exit");
  };


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

      {/* EXIT GUARD DIALOG */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 supports-[backdrop-filter]:bg-black/60 supports-[backdrop-filter]:backdrop-blur-sm p-4"
            onClick={() => setShowExitDialog(false)} // Close on click outside
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
              className="bg-background border border-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-amber-500">
                  <div className="p-2.5 bg-amber-500/10 rounded-full shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {t("exit_guard.title")}
                  </h2>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  {t("exit_guard.desc")}
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowExitDialog(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-foreground"
                  >
                    {t("exit_guard.cancel")}
                  </button>
                  <button
                    onClick={handleConfirmExit}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all hover:shadow-md"
                  >
                    {t("exit_guard.confirm")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YT-DLP UPDATE AVAILABLE BANNER (Info Only) */}


      {/* Content Container - Ensure above background */}
      <div className="relative z-10 w-full h-full flex flex-col will-change-transform">
        {children}
      </div>
    </div >
  );
}
