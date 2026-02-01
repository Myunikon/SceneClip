import { notify } from './notify'
import { translations } from './locales'
import { useAppStore } from '../store'
import { invoke } from '@tauri-apps/api/core'

export type BinaryType = 'ytdlp' | 'ffmpeg' | 'ffprobe' | 'node' | 'deno' | 'bun';

export interface ValidationResult {
    isValid: boolean;
    version?: string;
    error?: string;
}

/**
 * Validates a binary by running it with a version flag via Rust command.
 */
export async function validateBinary(path: string, type: BinaryType): Promise<ValidationResult> {
    if (!path || path.trim() === '' || path.includes('Auto-managed')) {
        return { isValid: false, error: 'Empty path' };
    }

    try {
        const flag = type === 'ffmpeg' || type === 'ffprobe' ? '-version' : '--version';
        const output = await invoke<string>('validate_binary', { path, flag });
        const firstLine = output.split('\n')[0].trim();

        if (type === 'ffmpeg') {
            const lowerOutput = output.toLowerCase();
            if (lowerOutput.includes('gyan.dev')) {
                if (lowerOutput.includes('--enable-libxml2') || lowerOutput.includes('full')) {
                    return {
                        isValid: false,
                        version: firstLine,
                        error: 'Non-Essentials FFmpeg detected. Please use FFmpeg Essentials to save space.'
                    };
                }
            }
        }

        return {
            isValid: true,
            version: firstLine || 'Unknown Version'
        };
    } catch (e) {
        return {
            isValid: false,
            error: String(e)
        };
    }
}

/**
 * Helper to detect binary type from filename
 */
export function detectBinaryType(filename: string): BinaryType | null {
    const lower = filename.toLowerCase();
    if (lower.includes('yt-dlp') || lower.includes('ytdlp')) return 'ytdlp';
    if (lower.includes('ffprobe')) return 'ffprobe';
    if (lower.includes('ffmpeg')) return 'ffmpeg';
    if (lower.includes('node')) return 'node';
    if (lower.includes('deno')) return 'deno';
    if (lower.includes('bun')) return 'bun';
    return null;
}

/**
 * Validates sidecar binaries using behavioral checks for logging.
 */
export async function runBinaryValidation(addLog: (entry: { message: string, level: 'info' | 'warning' | 'error' | 'success', source: 'system' | 'ytdlp' | 'ffmpeg' }) => void, language: string = 'en'): Promise<void> {
    try {
        const settings = useAppStore.getState().settings

        // FFmpeg Validation
        try {
            const ffPath = settings.binaryPathFfmpeg || 'ffmpeg'
            const res = await validateBinary(ffPath, 'ffmpeg')

            if (res.isValid && res.version?.toLowerCase().includes('ffmpeg')) {
                addLog({ message: "[Security] FFmpeg check passed (valid output).", level: 'success', source: 'system' })
            } else {
                addLog({ message: `[Security] WARNING: FFmpeg check returned unexpected output: ${res.error || 'Identity mismatch'}`, level: 'warning', source: 'system' })
            }
        } catch (e) {
            addLog({ message: `[Security] FFmpeg validation error: ${e}`, level: 'warning', source: 'system' })
        }

        // yt-dlp Validation
        try {
            const ytPath = settings.binaryPathYtDlp || 'yt-dlp'
            const res = await validateBinary(ytPath, 'ytdlp')

            if (res.isValid && res.version && /^\d{4}\.\d{2}\.\d{2}/.test(res.version.trim())) {
                addLog({ message: `[Security] yt-dlp check passed (version: ${res.version.trim()}).`, level: 'success', source: 'system' })
            } else {
                addLog({ message: `[Security] WARNING: yt-dlp output format mismatch or invalid.`, level: 'warning', source: 'system' })
            }
        } catch (e) {
            addLog({ message: `[Security] yt-dlp validation error: ${e}`, level: 'warning', source: 'system' })
        }

    } catch (e: unknown) {
        console.error("Binary validation failed", e)
        const t = translations[language as keyof typeof translations]?.errors || translations.en.errors
        notify.error(t.binary_crash, { description: e instanceof Error ? e.message : undefined })
        addLog({ message: `[Security] Binary validation failed: ${e instanceof Error ? e.message : e}`, level: 'error', source: 'system' })
    }
}
