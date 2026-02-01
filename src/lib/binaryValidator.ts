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

        // Enforce Essentials for FFmpeg if detected in first line or configuration
        if (type === 'ffmpeg') {
            // const lowerOutput = output.toLowerCase();
            const lowerOutput = output.toLowerCase();

            // Check if it's an 'essential' build or at least not a 'full' build from Gyan.dev
            // Gyan.dev usually puts build details in configuration
            if (lowerOutput.includes('gyan.dev')) {
                if (lowerOutput.includes('--enable-libxml2') || lowerOutput.includes('full')) {
                    return {
                        isValid: false,
                        version: firstLine,
                        error: 'Non-Essentials FFmpeg detected. Please use FFmpeg Essentials to save space.'
                    };
                }
            }

            // If it's BtbN (often Linux/ARM), it doesn't use 'essentials' nomenclature, 
            // but for Windows we prioritize Essentials.
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
