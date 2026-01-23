import { exists } from '@tauri-apps/plugin-fs';

/**
 * Generates a unique file path by appending a counter if the file already exists.
 * e.g., "video.mp4" -> "video_1.mp4" -> "video_2.mp4"
 * 
 * @param filePath Full absolute path to the desired file
 * @param maxAttempts Maximum number of attempts to find a unique name (default: 1000)
 * @returns A promise that resolves to a unique file path
 */
export async function getUniqueFilePath(filePath: string, maxAttempts = 1000): Promise<string> {
    try {
        const dotIndex = filePath.lastIndexOf('.');
        const hasExtension = dotIndex !== -1;

        const base = hasExtension ? filePath.substring(0, dotIndex) : filePath;
        const ext = hasExtension ? filePath.substring(dotIndex) : '';

        let counter = 1;
        let uniquePath = filePath;

        while (await exists(uniquePath) && counter < maxAttempts) {
            uniquePath = `${base}_${counter}${ext}`;
            counter++;
        }

        return uniquePath;
    } catch (error) {
        console.warn("Failed to check file existence, returning original path:", error);
        return filePath;
    }
}

/**
 * Saves a cookie string to a temporary file in the AppLocalData directory.
 * Returns the full path to the created file.
 * 
 * @param content Raw cookie content string
 * @param id Unique identifier (e.g. task ID) to prevent collisions
 */
export async function saveTempCookieFile(content: string, id: string): Promise<string> {
    try {
        const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        const { appLocalDataDir, join: joinPath } = await import('@tauri-apps/api/path');

        const fileName = `cookies_${id}.txt`;

        // Write to AppLocalData (safer permissions)
        await writeTextFile(fileName, content, { baseDir: BaseDirectory.AppLocalData });

        // Resolve full absolute path
        const appData = await appLocalDataDir();
        return await joinPath(appData, fileName);
    } catch (e) {
        throw new Error(`Failed to save temp cookie file: ${e}`);
    }
}
