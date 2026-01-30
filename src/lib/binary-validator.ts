import { notify } from './notify'
import { translations } from './locales'
import { useAppStore } from '../store'

/**
 * Validates sidecar binaries using behavioral checks.
 * - Check if binary can execute successfully via sidecar
 * - Verify output matches expected format (e.g., version string)
 */
// Validates sidecar binaries using behavioral checks via backend
// This avoids frontend scope issues and ensures consistent execution.
export async function runBinaryValidation(addLog: (entry: { message: string, type: 'info' | 'warning' | 'error' | 'success', source: 'system' | 'ytdlp' | 'ffmpeg' }) => void, language: string = 'en'): Promise<void> {
    try {
        const { invoke } = await import('@tauri-apps/api/core')
        const settings = useAppStore.getState().settings

        // ===== FFmpeg Validation =====
        try {
            // Note: backend 'validate_binary' takes (path, flag)
            // If path is empty string, backend logic needs to handle lookup or we pass 'ffmpeg'
            // But 'validate_binary' uses Command::new(path), so we need resolved path?
            // Actually, backend commands/updater.rs 'find_active_binary' logic is what we want...
            // But 'validate_binary' in system.rs takes a path. 
            // In system.rs 'validate_binary', it does Command::new(&path).
            // If we assume binaries are reachable via 'ffmpeg'/'yt-dlp' in PATH or resolved by backend...
            // Let's rely on 'check_updates' which we just fixed to resolve correct version.

            // Wait, this validator is for "Behavioral Checks". 
            // If 'check_updates' already confirms existence and version, do we NEED this?
            // "Security" logs suggest it's checking if it runs.

            // For now, let's use the path from settings OR delegate to 'check_updates' result logic implicitly?
            // Ideally, we pass the absolute path if we know it.
            // If settings.binaryPathFfmpeg is empty, we might fail here if not in PATH.
            // But currently the frontend logic was passing 'ffmpeg' (which relies on PATH/Sidecar).

            // Let's try invoking validate_binary with 'ffmpeg' and see if backend resolves it.
            // Backend `validate_binary` does NOT do resolution logic like `updater.rs`.
            // It just runs `Command::new(path)`.
            // If 'ffmpeg' is in PATH or sidecar folder, `Command::new("ffmpeg")` usually works if cwd is right.

            const ffPath = settings.binaryPathFfmpeg || 'ffmpeg'
            const out = await invoke<string>('validate_binary', { path: ffPath, flag: '-version' })

            if (out.toLowerCase().includes('ffmpeg')) {
                addLog({ message: "[Security] FFmpeg check passed (valid output).", type: 'success', source: 'system' })
            } else {
                addLog({ message: `[Security] WARNING: FFmpeg check returned unexpected output.`, type: 'warning', source: 'system' })
            }
        } catch (e) {
            // If implicit 'ffmpeg' fails, it might be because it's bundled sidecar but not in PATH.
            // But we fixed `updater.rs` to find it. 
            // Maybe we should just trust `getBinaryVersion` result? 
            // This validator seems redundant if getBinaryVersion works.
            // But let's keep it safe by logging warning instead of error if fails, or just using getBinaryVersion result?
            // The user likes this log.
            addLog({ message: `[Security] FFmpeg validation: ${e}`, type: 'warning', source: 'system' })
        }

        // ===== yt-dlp Validation =====
        try {
            const ytPath = settings.binaryPathYtDlp || 'yt-dlp'
            const out = await invoke<string>('validate_binary', { path: ytPath, flag: '--version' })

            if (/^\d{4}\.\d{2}\.\d{2}/.test(out.trim())) {
                addLog({ message: `[Security] yt-dlp check passed (version: ${out.trim()}).`, type: 'success', source: 'system' })
            } else {
                addLog({ message: `[Security] WARNING: yt-dlp output format mismatch.`, type: 'warning', source: 'system' })
            }
        } catch (e) {
            addLog({ message: `[Security] yt-dlp validation: ${e}`, type: 'warning', source: 'system' })
        }

    } catch (e: unknown) {
        console.error("Binary validation failed", e)
        const t = translations[language as keyof typeof translations]?.errors || translations.en.errors
        notify.error(t.binary_crash, { description: e instanceof Error ? e.message : undefined })
        addLog({ message: `[Security] Binary validation failed: ${e instanceof Error ? e.message : e}`, type: 'error', source: 'system' })
    }
}
