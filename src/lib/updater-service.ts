import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export interface UpdateInfo {
    current: string | null
    latest: string | null
    has_update: boolean
}

export interface UpdaterStatus {
    ytdlp: UpdateInfo
    ffmpeg: UpdateInfo
}

/**
 * Check for updates using Rust backend
 */
export async function checkForUpdates(): Promise<UpdaterStatus> {
    try {
        return await invoke<UpdaterStatus>('check_updates')
    } catch (e) {
        console.error("Failed to check updates:", e)
        return {
            ytdlp: { current: null, latest: null, has_update: false },
            ffmpeg: { current: null, latest: null, has_update: false }
        }
    }
}

/**
 * Update binary using Rust backend
 */
export async function updateBinary(binaryName: 'yt-dlp' | 'ffmpeg', onProgress?: (percent: number) => void): Promise<string> {

    let unlisten: (() => void) | undefined

    if (onProgress) {
        unlisten = await listen<{ binary: string, percent: number }>('update-progress', (event) => {
            if (event.payload.binary === binaryName) {
                onProgress(event.payload.percent)
            }
        })
    }

    try {
        const path = await invoke<string>('update_binary', { binary: binaryName })
        return path
    } finally {
        if (unlisten) unlisten()
    }
}

// Legacy helpers mapped to null or removed logic to maintain API compatibility if strictly needed
// but ideally should be removed. For now, we keep the export to avoid breaking imports elsewhere instantly.
export async function getBinaryVersion(binaryName: string): Promise<string | null> {
    try {
        const status = await checkForUpdates();
        if (binaryName === 'yt-dlp') return status.ytdlp.current;
        if (binaryName === 'ffmpeg') return status.ffmpeg.current;
        return null;
    } catch (e) {
        return null; // Fallback
    }
}

export async function getLatestVersion(_binaryName: string): Promise<string | null> {
    return null
}
