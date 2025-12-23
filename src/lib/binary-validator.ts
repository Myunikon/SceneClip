// import { appDataDir, join } from '@tauri-apps/api/path' // All unused now
import { exists } from '@tauri-apps/plugin-fs'
import { Command } from '@tauri-apps/plugin-shell'
// import { getPlatformInfo } from './platform'
import { verifyPathSafety } from './security'
import { toast } from 'sonner'

/**
 * Validates binaries using BEHAVIORAL checks instead of hash comparison.
 * 
 * Previous approach (problematic):
 * - Hardcoded TRUSTED_HASHES would flag valid updated binaries as "corrupted"
 * 
 * New approach:
 * - Check if binary can execute successfully
 * - Verify output matches expected format (e.g., version string)
 * - This works regardless of binary version
 */
export async function runBinaryValidation(addLog: (msg: string) => void): Promise<void> {
    try {
        const { getBinaryPaths } = await import('./ytdlp')
        const paths = await getBinaryPaths()
        const binDir = paths.binDir
        
        // ===== FFmpeg Validation =====
        const ffmpegPath = paths.ffmpeg
        
        // [Hardening] Path Safety Check (Traversal & Symlink)
        const isFfmpegSafe = await verifyPathSafety(ffmpegPath, binDir)
        if (!isFfmpegSafe && await exists(ffmpegPath)) {
            addLog("[Security] CRITICAL: FFmpeg path unsafe (Symlink/Traversal).")
            toast.error("Security Alert: FFmpeg path is unsafe!", { duration: 5000 })
            return 
        }

        if (await exists(ffmpegPath)) {
            try {
                const cmd = Command.create(ffmpegPath, ['-version'])
                const out = await cmd.execute()
                
                // FFmpeg outputs version info to stdout and exits with code 0
                if (out.code === 0 && out.stdout.toLowerCase().includes('ffmpeg')) {
                    addLog("[Security] FFmpeg behavioral check passed (valid version output).")
                } else {
                    addLog(`[Security] WARNING: FFmpeg behavioral check failed. Exit: ${out.code}`)
                    toast.warning("Security Alert: FFmpeg binary may be corrupted!", { duration: 5000 })
                }
            } catch (e) {
                addLog(`[Security] WARNING: FFmpeg execution failed. ${e}`)
                toast.warning("FFmpeg binary failed to execute", { duration: 5000 })
            }
        } else {
            addLog("[Security] FFmpeg not found, skipping validation.")
        }

        // ===== yt-dlp Validation =====
        const ytdlpPath = paths.ytdlp
        
        // [Hardening] Path Safety Check
        const isYtdlpSafe = await verifyPathSafety(ytdlpPath, binDir)
        if (!isYtdlpSafe && await exists(ytdlpPath)) {
            addLog("[Security] CRITICAL: yt-dlp path unsafe (Symlink/Traversal).")
            toast.error("Security Alert: yt-dlp path is unsafe!", { duration: 5000 })
            return
        }

        if (await exists(ytdlpPath)) {
            try {
                const cmd = Command.create(ytdlpPath, ['--version'])
                const out = await cmd.execute()
                
                // yt-dlp version format: YYYY.MM.DD or YYYY.MM.DD.patch
                if (out.code === 0 && /^\d{4}\.\d{2}\.\d{2}/.test(out.stdout.trim())) {
                    addLog(`[Security] yt-dlp behavioral check passed (version: ${out.stdout.trim()}).`)
                } else {
                    addLog(`[Security] WARNING: yt-dlp behavioral check failed. Exit: ${out.code}`)
                    toast.warning("Security Alert: yt-dlp binary may be corrupted!")
                }
            } catch (e) {
                addLog(`[Security] WARNING: yt-dlp execution failed. ${e}`)
                toast.warning("yt-dlp binary failed to execute", { duration: 5000 })
            }
        } else {
            addLog("[Security] yt-dlp not found, skipping validation.")
        }

    } catch (e: any) {
        console.error("Binary validation failed", e)
        addLog(`[Security] Binary validation failed: ${e?.message || e}`)
    }
}

