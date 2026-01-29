import { invoke } from '@tauri-apps/api/core';

export type BinaryType = 'ytdlp' | 'ffmpeg' | 'ffprobe' | 'node' | 'deno' | 'bun';

export interface ValidationResult {
    isValid: boolean;
    version?: string;
    error?: string;
}

/**
 * Validates a binary by running it with a version flag via Rust command.
 * This bypasses JS shell scope restrictions.
 */
export async function validateBinary(path: string, type: BinaryType): Promise<ValidationResult> {
    if (!path || path.trim() === '' || path.includes('Auto-managed')) {
        return { isValid: false, error: 'Empty path' };
    }

    try {
        // Different binaries use different version flags
        const flag = type === 'ffmpeg' || type === 'ffprobe' ? '-version' : '--version';

        // Call the custom Rust command
        const output = await invoke<string>('validate_binary', {
            path,
            flag
        });

        // Success! Extract version string (usually the first line)
        const firstLine = output.split('\n')[0].trim();

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
