import { type Platform, platform } from "@tauri-apps/plugin-os";

let cachedPlatform: Platform | null = null;

export function getPlatform(): Platform {
  if (!cachedPlatform) {
    try {
      cachedPlatform = platform();
    } catch (e) {
      console.warn("[Platform] Tauri OS plugin failed, using fallback:", e);
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("win")) cachedPlatform = "windows";
      else if (ua.includes("mac")) cachedPlatform = "macos";
      else if (ua.includes("linux")) cachedPlatform = "linux";
      else cachedPlatform = "windows"; // Default safe fallback
    }
  }
  return cachedPlatform as Platform;
}

function getPlatformInfo() {
  const os = getPlatform();
  return {
    isWindows: os === "windows",
    isMacOS: os === "macos",
    isLinux: os === "linux",
    exeExtension: os === "windows" ? ".exe" : "",
  };
}

/**
 * Get platform-specific binary filename
 */
export function getBinaryName(binary: "ffmpeg" | "ffprobe" | "ytdlp"): string {
  const { isWindows } = getPlatformInfo();
  const names: Record<string, string> = {
    ffmpeg: isWindows ? "ffmpeg.exe" : "ffmpeg",
    ffprobe: isWindows ? "ffprobe.exe" : "ffprobe",
    ytdlp: isWindows ? "yt-dlp.exe" : "yt-dlp",
  };
  return names[binary];
}

/**
 * Check if running in Tauri context (not browser-only)
 */
export function isTauriAvailable(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// Shortcut Utilities
export const IS_MAC = getPlatform() === 'macos';
export const IS_WINDOWS = getPlatform() === 'windows';

export const getModifierKey = () => IS_MAC ? 'Meta' : 'Control';
export const getShortcutSymbol = () => IS_MAC ? '⌘' : 'Ctrl';
export const getAltSymbol = () => IS_MAC ? '⌥' : 'Alt';
export const getShiftSymbol = () => IS_MAC ? '⇧' : 'Shift';
