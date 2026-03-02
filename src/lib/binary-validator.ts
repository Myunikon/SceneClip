import { notify } from './notify'
import { translations } from './locales'
import { invoke } from '@tauri-apps/api/core'

export type BinaryType = 'ytdlp' | 'ffmpeg' | 'ffprobe' | 'node' | 'deno' | 'bun';

export interface ValidationResult {
    isValid: boolean;
    version?: string;
    error?: string;
}

export interface ValidationReport {
    ffmpeg: ValidationResult;
    ytdlp: ValidationResult;
}

/**
 * Validates sidecar binaries using behavioral checks for logging, now fully orchestrated in Rust.
 */
export async function runBinaryValidation(
    addLog: (entry: { message: string, level: 'info' | 'warning' | 'error' | 'success', source: 'system' | 'ytdlp' | 'ffmpeg' }) => void,
    language: string = 'en'
): Promise<void> {
    try {
        const report = await invoke<ValidationReport>('validate_all_sidecars');

        // FFmpeg Validation Logging
        if (report.ffmpeg.isValid && report.ffmpeg.version) {
            addLog({ message: `[Security] FFmpeg check passed (valid output).`, level: 'success', source: 'system' })
        } else {
            addLog({ message: `[Security] WARNING: FFmpeg check returned unexpected output: ${report.ffmpeg.error || 'Identity mismatch'}`, level: 'warning', source: 'system' })
        }

        // yt-dlp Validation Logging
        if (report.ytdlp.isValid && report.ytdlp.version) {
            addLog({ message: `[Security] yt-dlp check passed (version: ${report.ytdlp.version}).`, level: 'success', source: 'system' })
        } else {
            addLog({ message: `[Security] WARNING: yt-dlp output format mismatch or invalid. Error: ${report.ytdlp.error || 'Unknown'}`, level: 'warning', source: 'system' })
        }

    } catch (e: unknown) {
        console.error("Binary validation failed", e)
        const t = translations[language as keyof typeof translations]?.errors || translations.en.errors
        notify.error(t.binary_crash, { description: e instanceof Error ? e.message : undefined })
        addLog({ message: `[Security] Binary validation failed: ${e instanceof Error ? e.message : e}`, level: 'error', source: 'system' })
    }
}
