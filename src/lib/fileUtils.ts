import { invoke } from '@tauri-apps/api/core';

/**
 * Generates a unique file path by appending a counter if the file already exists.
 * e.g., "video.mp4" -> "video (1).mp4" -> "video (2).mp4"
 * 
 * Logic migrated to Rust for performance.
 */
export async function getUniqueFilePath(filePath: string): Promise<string> {
    try {
        return await invoke<string>('get_unique_filepath', { filePath });
    } catch (error) {
        console.warn("[Rust] Failed to get unique path, returning original:", error);
        return filePath;
    }
}

/**
 * Saves a cookie string to a temporary file in the AppLocalData directory.
 * Returns the full path to the created file.
 * 
 * Logic migrated to Rust for security and simplicity.
 */
export async function saveTempCookieFile(content: string, id: string): Promise<string> {
    try {
        return await invoke<string>('save_temp_cookie_file', { content, id });
    } catch (e) {
        throw new Error(`[Rust] Failed to save temp cookie file: ${e}`);
    }
}
