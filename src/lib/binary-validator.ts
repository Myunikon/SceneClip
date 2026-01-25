/**
 * Binary Validator for Sidecar Binaries
 * Validates bundled binaries using BEHAVIORAL checks (can they execute and return valid output?)
 */
import { Command } from '@tauri-apps/plugin-shell'
import { notify } from './notify'
import { translations } from './locales'
import { BINARIES } from './constants'

/**
 * Validates sidecar binaries using behavioral checks.
 * - Check if binary can execute successfully via sidecar
 * - Verify output matches expected format (e.g., version string)
 */
export async function runBinaryValidation(addLog: (entry: { message: string, type: 'info' | 'warning' | 'error' | 'success' }) => void, language: string = 'en'): Promise<void> {
    try {
        // ===== FFmpeg Validation (Sidecar) =====
        try {
            const cmd = Command.sidecar(BINARIES.FFMPEG, ['-version'])
            const out = await cmd.execute()

            if (out.code === 0 && out.stdout.toLowerCase().includes('ffmpeg')) {
                addLog({ message: "[Security] FFmpeg sidecar check passed (valid version output).", type: 'success' })
            } else {
                addLog({ message: `[Security] WARNING: FFmpeg sidecar check failed. Exit: ${out.code}`, type: 'warning' })
                notify.warning("Security Alert: FFmpeg binary may be corrupted!", { duration: 5000 })
            }
        } catch (e) {
            addLog({ message: `[Security] WARNING: FFmpeg sidecar execution failed. ${e}`, type: 'error' })
            notify.warning("FFmpeg sidecar failed to execute", { duration: 5000 })
        }

        // ===== yt-dlp Validation (Sidecar) =====
        try {
            const cmd = Command.sidecar(BINARIES.YTDLP, ['--version'])
            const out = await cmd.execute()

            // yt-dlp version format: YYYY.MM.DD or YYYY.MM.DD.patch
            if (out.code === 0 && /^\d{4}\.\d{2}\.\d{2}/.test(out.stdout.trim())) {
                addLog({ message: `[Security] yt-dlp sidecar check passed (version: ${out.stdout.trim()}).`, type: 'success' })
            } else {
                addLog({ message: `[Security] WARNING: yt-dlp sidecar check failed. Exit: ${out.code}`, type: 'warning' })
                notify.warning("Security Alert: yt-dlp binary may be corrupted!")
            }
        } catch (e) {
            addLog({ message: `[Security] WARNING: yt-dlp sidecar execution failed. ${e}`, type: 'error' })
            notify.warning("yt-dlp sidecar failed to execute", { duration: 5000 })
        }

    } catch (e: unknown) {
        console.error("Binary validation failed", e)
        const t = translations[language as keyof typeof translations]?.errors || translations.en.errors
        notify.error(t.binary_crash, { description: e instanceof Error ? e.message : undefined })
        addLog({ message: `[Security] Binary validation failed: ${e instanceof Error ? e.message : e}`, type: 'error' })
    }
}
