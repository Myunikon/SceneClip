import { Command } from '@tauri-apps/plugin-shell'
import { fetch } from '@tauri-apps/plugin-http'

/**
 * Get the version of a sidecar binary
 */
export async function getBinaryVersion(binaryName: 'yt-dlp' | 'ffmpeg'): Promise<string | null> {
    try {
        // match the name in capabilities/default.json
        const cmd = Command.sidecar(binaryName, binaryName === 'ffmpeg' ? ['-version'] : ['--version'])
        const output = await cmd.execute()

        console.log(`[Binary Check] ${binaryName} exit code: ${output.code}`)

        if (output.code === 0) {
            let stdout = typeof output.stdout === 'string' ? output.stdout : new TextDecoder().decode(output.stdout)
            const stderr = typeof output.stderr === 'string' ? output.stderr : new TextDecoder().decode(output.stderr)

            stdout = stdout.trim()
            const fullOutput = stdout || stderr // Fallback to stderr if stdout is empty

            if (binaryName === 'ffmpeg') {
                const match = fullOutput.match(/ffmpeg version ([^\s]+)/i)
                return match ? match[1] : fullOutput.split('\n')[0]
            }
            return fullOutput.split('\n')[0]
        } else {
            const stderr = typeof output.stderr === 'string' ? output.stderr : new TextDecoder().decode(output.stderr)
            console.warn(`[Binary Check] ${binaryName} failed:`, stderr)
        }
    } catch (e) {
        console.error(`Failed to get version for ${binaryName}:`, e)
    }
    return null
}

/**
 * Get the latest version of a binary from GitHub releases
 */
export async function getLatestVersion(binaryName: 'yt-dlp' | 'ffmpeg'): Promise<string | null> {
    try {
        const repoMap = {
            'yt-dlp': 'yt-dlp/yt-dlp',
            'ffmpeg': 'BtbN/FFmpeg-Builds'
        }
        const repo = repoMap[binaryName]

        const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'SceneClip'
            }
        })

        if (response.ok) {
            const data = await response.json() as { tag_name: string }
            // yt-dlp uses version like "2024.12.23"
            // FFmpeg-Builds uses version like "autobuild-2024-12-23-14-21"
            return data.tag_name || null
        }
    } catch (e) {
        console.error(`Failed to fetch latest version for ${binaryName}:`, e)
    }
    return null
}

/**
 * Compare two version strings (simple date-based comparison for yt-dlp)
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(current: string | null, latest: string | null): number {
    if (!current || !latest) return 0

    // Robust numeric chunk comparison (handles "7.0.2" vs "2024.12.23")
    const extractParts = (v: string) => v.split(/[^0-9]+/).filter(Boolean).map(Number)

    const cParts = extractParts(current)
    const lParts = extractParts(latest)

    for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
        const cVal = cParts[i] || 0
        const lVal = lParts[i] || 0
        if (cVal < lVal) return -1
        if (cVal > lVal) return 1
    }

    return 0
}

/**
 * Check if update is available
 */
export async function checkForUpdates(): Promise<{
    ytdlp: { current: string | null, latest: string | null, hasUpdate: boolean },
    ffmpeg: { current: string | null, latest: string | null, hasUpdate: boolean }
}> {
    const [ytdlpCurrent, ffmpegCurrent] = await Promise.all([
        getBinaryVersion('yt-dlp'),
        getBinaryVersion('ffmpeg')
    ])

    const [ytdlpLatest, ffmpegLatest] = await Promise.all([
        getLatestVersion('yt-dlp'),
        getLatestVersion('ffmpeg')
    ])

    return {
        ytdlp: {
            current: ytdlpCurrent,
            latest: ytdlpLatest,
            hasUpdate: compareVersions(ytdlpCurrent, ytdlpLatest) < 0
        },
        ffmpeg: {
            current: ffmpegCurrent,
            latest: ffmpegLatest,
            hasUpdate: compareVersions(ffmpegCurrent, ffmpegLatest) < 0
        }
    }
}
