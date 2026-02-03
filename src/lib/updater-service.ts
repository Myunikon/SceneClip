import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export interface UpdateInfo {
    current: string | null
    latest: string | null
    has_update: boolean
    integrity_valid: boolean
    error?: string
}

export interface UpdaterStatus {
    app_update: UpdateInfo
    ytdlp: UpdateInfo
}

/**
 * Check for updates using Rust backend
 */
export async function checkForUpdates(scope: 'app' | 'binaries' | 'all' = 'all'): Promise<UpdaterStatus> {
    return await invoke<UpdaterStatus>('check_updates', { scope })
}

/**
 * Update binary using Rust backend
 */
export async function updateBinary(binaryName: 'yt-dlp', onProgress?: (percent: number) => void): Promise<string> {

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
        return await invoke<string | null>('get_binary_version_local', { binary: binaryName });
    } catch (e) {
        console.error(`Failed to get version for ${binaryName}:`, e);
        return null;
    }
}

export async function getLatestVersion() {
    return null
}
