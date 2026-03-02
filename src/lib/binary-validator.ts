import { notify } from './notify'
import { translations } from './locales'
import { invoke } from '@tauri-apps/api/core'

export type BinaryType = 'ytdlp' | 'ffmpeg' | 'ffprobe' | 'node' | 'deno' | 'bun';

export interface ValidationResult {
    isValid: boolean;
    version?: string;
    error?: string;
}

/**
 * Infers binary type from a file path based on the filename.
 * Returns null if the type cannot be determined.
 */
export function detectBinaryType(path: string): BinaryType | null {
    const name = path.replace(/\\/g, '/').split('/').pop()?.toLowerCase() ?? '';
    const base = name.replace(/\.exe$/i, '');

    if (base.includes('yt-dlp') || base.includes('ytdlp') || base === 'yt-dlp_x86') return 'ytdlp';
    if (base === 'ffprobe') return 'ffprobe';
    if (base.includes('ffmpeg')) return 'ffmpeg';
    if (base.includes('node')) return 'node';
    if (base.includes('deno')) return 'deno';
    if (base.includes('bun')) return 'bun';
    return null;
}

/**
 * Validates a single binary at the given path by invoking it and checking its output.
 */
export async function validateBinary(path: string, type: BinaryType): Promise<ValidationResult> {
    try {
        const result = await invoke<ValidationResult>('validate_single_binary', { path, binaryType: type });
        return result;
    } catch (e) {
        return {
            isValid: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }
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
