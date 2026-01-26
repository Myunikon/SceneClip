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

/**
 * Update a binary
 */
export async function updateBinary(binaryName: 'yt-dlp' | 'ffmpeg'): Promise<string> {
    const { fetch } = await import('@tauri-apps/plugin-http')
    const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    const { join } = await import('@tauri-apps/api/path')
    const { type } = await import('@tauri-apps/plugin-os')

    const platform = await type()
    const isWin = platform === 'windows'

    // 1. Get Latest Release Asset URL
    const repoMap = {
        'yt-dlp': 'yt-dlp/yt-dlp',
        'ffmpeg': 'BtbN/FFmpeg-Builds' // Note: FFmpeg builds are complex zip files, skipping for now
    }

    if (binaryName === 'ffmpeg') {
        throw new Error("FFmpeg auto-update not yet supported (requires zip extraction)")
    }

    const repo = repoMap[binaryName]
    const releasesUrl = `https://api.github.com/repos/${repo}/releases/latest`

    console.log(`[Updater] Fetching release info from ${releasesUrl}`)
    const response = await fetch(releasesUrl, {
        headers: { 'User-Agent': 'SceneClip' }
    })

    if (!response.ok) throw new Error(`Failed to fetch release info: ${response.statusText}`)

    const data: any = await response.json()
    const assets = data.assets || []

    // Find correct asset
    // yt-dlp.exe (Windows), yt-dlp (Linux/Mac with chmod)
    // yt-dlp_macos (Mac)
    let assetName = 'yt-dlp'
    if (isWin) assetName = 'yt-dlp.exe'
    else if (platform === 'macos') assetName = 'yt-dlp_macos'

    const asset = assets.find((a: any) => a.name === assetName)
    if (!asset) {
        // Fallback checks
        if (isWin) {
            const exeAsset = assets.find((a: any) => a.name.endsWith('.exe') && !a.name.includes('x86'))
            if (exeAsset) assetName = exeAsset.name
        }
    }

    const targetAsset = assets.find((a: any) => a.name === assetName)
    if (!targetAsset) throw new Error(`No compatible binary found for ${platform}`)

    const downloadUrl = targetAsset.browser_download_url
    console.log(`[Updater] Downloading from ${downloadUrl}`)

    // 2. Download File
    const downloadRes = await fetch(downloadUrl)
    if (!downloadRes.ok) throw new Error("Failed to download binary")

    const buffer = await downloadRes.arrayBuffer()
    const binaryData = new Uint8Array(buffer)

    // 3. Save to AppLocalData (writable)
    // We cannot write to Resource path.
    const fileName = isWin ? 'yt-dlp.exe' : 'yt-dlp'

    // Write directly.
    await writeFile(fileName, binaryData, { baseDir: BaseDirectory.AppLocalData })

    // 4. Resolve Absolute Path (Moved up for permissions)
    const { appLocalDataDir } = await import('@tauri-apps/api/path')
    const appData = await appLocalDataDir()
    const fullSavedPath = await join(appData, fileName)

    console.log(`[Updater] Binary saved to: ${fullSavedPath}`)

    // 5. Set Permissions (Unix)
    if (!isWin) {
        try {
            // Need to set executable capability
            console.log(`[Updater] Setting executable permissions for ${fullSavedPath}`)
            const chmod = Command.create('chmod', ['+x', fullSavedPath])
            const out = await chmod.execute()
            if (out.code !== 0) {
                console.warn(`[Updater] chmod failed: ${out.stderr}`)
                throw new Error(`Failed to set executable permissions: ${out.stderr}`)
            }
        } catch (e) {
            console.error(`[Updater] Permission Error: ${e}`)
            throw e
        }
    }

    return fullSavedPath
}
