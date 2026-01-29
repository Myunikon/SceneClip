/**
 * Binary Validator for Sidecar Binaries
 * Validates bundled binaries using BEHAVIORAL checks (can they execute and return valid output?)
 */
import { notify } from './notify'
import { translations } from './locales'
import { useAppStore } from '../store'
import { getYtDlpCommand, getFFmpegCommand } from './ytdlp'

/**
 * Validates sidecar binaries using behavioral checks.
 * - Check if binary can execute successfully via sidecar
 * - Verify output matches expected format (e.g., version string)
 */
export async function runBinaryValidation(addLog: (entry: { message: string, type: 'info' | 'warning' | 'error' | 'success', source: 'system' | 'ytdlp' | 'ffmpeg' }) => void, language: string = 'en'): Promise<void> {
    try {
        // ===== FFmpeg Validation (Sidecar) =====
        try {
            const settings = useAppStore.getState().settings
            const cmd = await getFFmpegCommand(['-version'], settings.binaryPathFfmpeg)
            const out = await cmd.execute()

            if (out.code === 0 && out.stdout.toLowerCase().includes('ffmpeg')) {
                addLog({ message: "[Security] FFmpeg sidecar check passed (valid version output).", type: 'success', source: 'system' })
            } else {
                addLog({ message: `[Security] WARNING: FFmpeg sidecar check failed. Exit: ${out.code}`, type: 'warning', source: 'system' })
                notify.warning("Security Alert: FFmpeg binary may be corrupted!", { duration: 5000 })
            }
        } catch (e) {
            addLog({ message: `[Security] WARNING: FFmpeg sidecar execution failed. ${e}`, type: 'error', source: 'system' })
            notify.warning("FFmpeg sidecar failed to execute", { duration: 5000 })
        }

        // ===== yt-dlp Validation (Sidecar) =====
        try {
            const settings = useAppStore.getState().settings
            const cmd = await getYtDlpCommand(['--version'], settings.binaryPathYtDlp)
            const out = await cmd.execute()

            // yt-dlp version format: YYYY.MM.DD or YYYY.MM.DD.patch
            if (out.code === 0 && /^\d{4}\.\d{2}\.\d{2}/.test(out.stdout.trim())) {
                addLog({ message: `[Security] yt-dlp sidecar check passed (version: ${out.stdout.trim()}).`, type: 'success', source: 'system' })
            } else {
                addLog({ message: `[Security] WARNING: yt-dlp sidecar check failed. Exit: ${out.code}`, type: 'warning', source: 'system' })
                notify.warning("Security Alert: yt-dlp binary may be corrupted!")
            }
        } catch (e) {
            addLog({ message: `[Security] WARNING: yt-dlp sidecar execution failed. ${e}`, type: 'error', source: 'system' })
            notify.warning("yt-dlp sidecar failed to execute", { duration: 5000 })
        }

    } catch (e: unknown) {
        console.error("Binary validation failed", e)
        const t = translations[language as keyof typeof translations]?.errors || translations.en.errors
        notify.error(t.binary_crash, { description: e instanceof Error ? e.message : undefined })
        addLog({ message: `[Security] Binary validation failed: ${e instanceof Error ? e.message : e}`, type: 'error', source: 'system' })
    }
}
