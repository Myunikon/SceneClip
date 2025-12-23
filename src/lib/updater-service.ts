import { Command } from '@tauri-apps/plugin-shell'

/**
 * Get the version of a sidecar binary
 */
export async function getBinaryVersion(binaryName: 'yt-dlp' | 'ffmpeg'): Promise<string | null> {
    try {
        // match the name in capabilities/default.json
        const cmd = Command.sidecar(`binaries/${binaryName}`, binaryName === 'ffmpeg' ? ['-version'] : ['--version'])
        const output = await cmd.execute()
        
        if (output.code === 0) {
            const stdout = output.stdout.trim()
            // ffmpeg version output is multiline, take first line
            // yt-dlp is usually single line 2024.10.10
            if (binaryName === 'ffmpeg') {
                const match = stdout.match(/ffmpeg version ([^\s]+)/)
                return match ? match[1] : stdout.split('\n')[0]
            }
            return stdout.split('\n')[0]
        }
    } catch (e) {
        console.error(`Failed to get version for ${binaryName}:`, e)
    }
    return null
}
