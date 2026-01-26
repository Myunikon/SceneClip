/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppSettings } from '../store/slices/types'
import { Command } from '@tauri-apps/plugin-shell'
import { BINARIES, DEFAULTS } from './constants'

export interface YtDlpOptions {
    path?: string
    rangeStart?: number | string
    rangeEnd?: number | string
    format?: string
    container?: string
    // Audio options
    audioBitrate?: string
    audioFormat?: 'mp3' | 'm4a' | 'flac' | 'wav' | 'opus' | 'aac'
    // Video codec preference
    videoCodec?: 'auto' | 'av1' | 'h264' | 'vp9' | 'hevc'
    // Subtitle options
    subtitles?: boolean
    subtitleFormat?: string
    subtitleLang?: string
    embedSubtitles?: boolean
    // SponsorBlock
    removeSponsors?: boolean
    // Livestream support
    liveFromStart?: boolean
    // Chapters
    splitChapters?: boolean
    // Audio Enhancements
    audioNormalization?: boolean
    // GIF Options
    gifFps?: number
    gifScale?: number
    gifQuality?: 'high' | 'fast'
    forceTranscode?: boolean
    cookies?: string
    userAgent?: string
}

export async function buildYtDlpArgs(
    url: string,
    options: YtDlpOptions,
    settings: AppSettings,
    finalFilename: string,
    gpuType: 'cpu' | 'nvidia' | 'amd' | 'intel' | 'apple' = 'cpu'
): Promise<string[]> {
    const fmt = options.format || settings.resolution
    const container = options.container || settings.container || 'mp4'
    const isClipping = !!(options.rangeStart || options.rangeEnd)
    const isGif = fmt === 'gif'

    // Force single thread & no-part for clips/gifs to prevent fragmentation/locking issues (WinError 32)
    const concurrentFragments = (isClipping || isGif) ? '1' : String(Math.max(1, settings.concurrentFragments || 4))

    const args: string[] = [
        '-o', finalFilename, // Full path included in finalFilename
        '--newline',
        '--no-colors',
        '--no-playlist',
        '--encoding', 'utf-8', // Force UTF-8 output to prevent Tauri shell encoding errors
        // CONCURRENT FRAGMENTS (Speed Boost)
        '-N', concurrentFragments,
        '--continue', // Force resume support
        '--socket-timeout', DEFAULTS.SOCKET_TIMEOUT, // Refresh link if connection hangs/throttles
    ]

    if (isClipping || isGif) {
        args.push('--no-part')
    }

    // GPU Detection Logic
    let activeGpuType = gpuType
    if (!settings.hardwareDecoding) {
        activeGpuType = 'cpu'
    } else if (gpuType === 'cpu') {
        // settings.hardwareDecoding is true, but no GPU detected
        // We'll let it stay as 'cpu' or yt-dlp might fail
    }

    if (fmt === 'audio') {
        // Use user's preferred audio format, default to mp3 for maximum compatibility
        const audioFormat = options.audioFormat || 'mp3'
        args.push('-x', '--audio-format', audioFormat)

        // Audio quality: 0 = best, 10 = worst. Convert kbps to quality level
        // 320K = ~0, 256K = ~1, 192K = ~2, 128K = ~5, 64K = ~9
        const bitrate = options.audioBitrate || '192'
        const qualityMap: Record<string, string> = {
            '320': '0', '256': '1', '192': '2', '160': '3', '128': '5', '96': '7', '64': '9'
        }
        args.push('--audio-quality', qualityMap[bitrate] || '2')

        // AUDIO NORMALIZATION (Loudness)
        // Handled via consolidated block below? No, this is inside fmt === 'audio'.
        // We keep it here as audio extraction forces re-encode anyway.
        if (options.audioNormalization) {
            args.push('--postprocessor-args', 'ffmpeg:-af loudnorm=I=-16:TP=-1.5:LRA=11')
        }

    } else if (fmt === 'gif') {

        args.push('-S', 'res:720,ext:mp4,fps:30') // Limit source to 720p30 for sanity

        const fps = options.gifFps || 15
        // Use nullish coalescing (??) to allow 0 as valid value (original size)
        const scaleHeight = options.gifScale ?? 480

        const scaleFilter = scaleHeight > 0
            ? `,scale=-2:'min(${scaleHeight},ih)':flags=lanczos`
            : ''

        let gifFilter = ""

        if (options.gifQuality === 'high') {

            gifFilter = `fps=${fps}${scaleFilter},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
        } else {

            gifFilter = `fps=${fps}${scaleFilter}`
        }

        args.push('--recode-video', 'gif')
        args.push('--postprocessor-args', `VideoConvertor:-vf ${gifFilter} -loop 0`)


    } else {
        // activeGpuType calculated above

        let h = ''
        if (fmt !== 'Best' && fmt !== 'audio') {

            const resolution = String(fmt).replace(/p$/i, '')
            h = `[height<=${resolution}]`
        }

        // Codec Logic
        const codec = options.videoCodec || 'auto'
        let formatString = ''

        if (codec === 'h264') {
            formatString = `bestvideo${h}[vcodec^=avc]+bestaudio[ext=m4a]/best${h}[ext=mp4]`
        } else if (codec === 'av1') {
            formatString = `bestvideo${h}[vcodec^=av01]+bestaudio/bestvideo${h}[vcodec^=vp9]+bestaudio`
        } else if (codec === 'vp9') {
            formatString = `bestvideo${h}[vcodec^=vp9]+bestaudio`
        } else if (codec === 'hevc') {
            formatString = `bestvideo${h}[vcodec^=hevc]+bestaudio/bestvideo${h}[vcodec^=hev1]+bestaudio/bestvideo${h}[vcodec^=hvc1]+bestaudio`
        } else {
            // Auto / Best (Default)
            formatString = `bestvideo${h}+bestaudio/best${h}`
        }

        args.push('-f', formatString)

        if (options.forceTranscode && codec !== 'auto') {
            let transcodeArgs = ''

            // Audio Copy (-c:a copy) preserves original audio quality
            const getEncoder = (sw: string, nvidia: string, amd: string, intel: string, apple: string) => {
                if (activeGpuType === 'nvidia') return nvidia
                if (activeGpuType === 'amd') return amd
                if (activeGpuType === 'intel') return intel
                if (activeGpuType === 'apple') return apple
                return sw
            }

            if (codec === 'h264') {
                const enc = getEncoder('libx264', 'h264_nvenc', 'h264_amf', 'h264_qsv', 'h264_videotoolbox')
                // Audio Encoding Logic
                const audioParams = options.audioNormalization ? '-c:a aac -b:a 192k' : '-c:a copy'

                if (activeGpuType !== 'cpu') {
                    if (activeGpuType === 'nvidia') transcodeArgs = `-c:v ${enc} -rc:v vbr -cq:v 19 -preset p4 ${audioParams}`
                    else if (activeGpuType === 'amd') transcodeArgs = `-c:v ${enc} -rc cqp -qp_i 22 -qp_p 22 ${audioParams}`
                    else if (activeGpuType === 'intel') transcodeArgs = `-c:v ${enc} -global_quality 20 ${audioParams}`
                    else if (activeGpuType === 'apple') transcodeArgs = `-c:v ${enc} -q:v 65 ${audioParams}`
                } else {
                    transcodeArgs = `-c:v ${enc} -crf 23 -preset medium ${audioParams}`
                }
            } else if (codec === 'av1') {
                const audioParams = options.audioNormalization ? '-c:a libopus -b:a 128k' : '-c:a copy'
                transcodeArgs = `-c:v libsvtav1 -crf 30 -preset 8 ${audioParams}`
            } else if (codec === 'vp9') {
                const audioParams = options.audioNormalization ? '-c:a libopus -b:a 128k' : '-c:a copy'
                transcodeArgs = `-c:v libvpx-vp9 -crf 30 -b:v 0 ${audioParams}`
            } else if (codec === 'hevc') {
                const enc = getEncoder('libx265', 'hevc_nvenc', 'hevc_amf', 'hevc_qsv', 'hevc_videotoolbox')
                const audioParams = options.audioNormalization ? '-c:a aac -b:a 192k' : '-c:a copy'

                if (activeGpuType !== 'cpu') {
                    if (activeGpuType === 'nvidia') transcodeArgs = `-c:v ${enc} -rc:v vbr -cq:v 26 -preset p4 ${audioParams}`
                    else if (activeGpuType === 'amd') transcodeArgs = `-c:v ${enc} -rc cqp -qp_i 26 -qp_p 26 ${audioParams}`
                    else if (activeGpuType === 'intel') transcodeArgs = `-c:v ${enc} -global_quality 26 ${audioParams}`
                    else if (activeGpuType === 'apple') transcodeArgs = `-c:v ${enc} -q:v 60 ${audioParams}`
                } else {
                    transcodeArgs = `-c:v ${enc} -crf 26 -preset medium ${audioParams}`
                }
            }

            if (transcodeArgs) {
                args.push('--postprocessor-args', `VideoConvertor:${transcodeArgs}`)
            }
        }

        // MAGIC REMUX: Ensure output is always the desired container (mp4/mkv)
        args.push('--merge-output-format', container)
    }

    // Clipping support using yt-dlp's native download-sections
    if (options.rangeStart || options.rangeEnd) {
        const sanitizeTime = (t: string | number) => String(t).replace(/[^0-9:.]/g, '')

        const start = options.rangeStart ? sanitizeTime(options.rangeStart) : '0'
        const end = options.rangeEnd ? sanitizeTime(options.rangeEnd) : 'inf'

        args.push('--download-sections', `*${start}-${end}`)
        args.push('--force-keyframes-at-cuts') // Clean cuts
    }
    // isClipping moved to top

    // --- CONSOLIDATED FFMPEG ARGS ---
    const ffmpegArgs: string[] = []

    // 1. Audio Normalization (Loudness)
    // Must trigger RE-ENCODING for audio. Conflicting with -c:a copy will crash ffmpeg.
    if (options.audioNormalization && fmt !== 'gif') {
        ffmpegArgs.push('-af loudnorm=I=-16:TP=-1.5:LRA=11')
        // Force AAC encoding if not already specified by HW logic
        // We will deduplicate or handle precedence in the final join
    }

    // 2. Hardware Acceleration & Codec Logic
    // FIX: Strictly disable generic HW args if we are already forcing a transcode (VideoConvertor)
    // This prevents "Double Transcode" conflicts.
    if (activeGpuType !== 'cpu' && fmt !== 'audio' && fmt !== 'gif' && !options.forceTranscode) {
        const encoderMap: Record<string, string> = {
            'nvidia': 'h264_nvenc',
            'amd': 'h264_amf',
            'intel': 'h264_qsv',
            'apple': 'h264_videotoolbox'
        }
        const encoder = encoderMap[activeGpuType]

        if (encoder) {
            let hwArgs = `-c:v ${encoder}`

            if (isClipping) {
                if (activeGpuType === 'nvidia') {
                    hwArgs += ` -rc:v vbr -cq:v 19 -preset p4 -forced-idr 1`
                } else if (activeGpuType === 'amd') {
                    hwArgs += ` -rc cqp -qp_i 22 -qp_p 22`
                } else if (activeGpuType === 'intel') {
                    hwArgs += ` -global_quality 20`
                } else if (activeGpuType === 'apple') {
                    hwArgs += ` -q:v 65`
                } else {
                    hwArgs += ` -b:v 10M`
                }
            }

            ffmpegArgs.push(hwArgs)
        }
    }

    // 3. Clipping Consistency
    if (isClipping) {
        if (fmt !== 'gif') {
            ffmpegArgs.push('-movflags +faststart -avoid_negative_ts make_zero')
        } else {
            ffmpegArgs.push('-avoid_negative_ts make_zero -map_metadata 0')
        }
    }

    // 4. Force Audio Codec if Normalization is Active
    // This is the CRITICAL FIX for the "copy with filter" crash.
    // If we have loudnorm, we CANNOT use "copy". behavior.
    if (options.audioNormalization && fmt !== 'gif') {
        const hasCustomAudioCodec = ffmpegArgs.some(a => a.includes('-c:a '))
        if (!hasCustomAudioCodec) {
            // Default to AAC 192k for best compatibility and quality retention vs re-encode
            ffmpegArgs.push('-c:a aac -b:a 192k')
        }
    } else if (activeGpuType !== 'cpu' && fmt !== 'audio' && fmt !== 'gif' && !isClipping && !options.forceTranscode) {
        // HW Accel default: Copy audio (fastest) IF compression implies it or we are just effectively remuxing video
        // Valid only if NOT normalizing.
        // Actually, previous logic was strict about copying.
        // If we are transcoding video (HW), we usually want to copy audio.
        const hasCustomAudioCodec = ffmpegArgs.some(a => a.includes('-c:a '))
        if (!hasCustomAudioCodec) {
            ffmpegArgs.push('-c:a copy')
        }
    }

    // Push Consolidated Args
    if (ffmpegArgs.length > 0) {
        args.push('--postprocessor-args', `ffmpeg:${ffmpegArgs.join(' ')}`)
    }

    // Subtitle download support
    if (options.subtitles) {
        const lang = options.subtitleLang || 'en'

        if (lang === 'all') {
            args.push('--write-subs', '--all-subs')
        } else if (lang === 'auto') {
            // Smart Auto: prioritize app language, then English
            // If app language is Indonesian ('id'), try: id-orig, id, en-orig, en
            const appLang = settings.language === 'id' ? 'id' : (settings.language === 'ms' ? 'ms' : 'en')
            // FIX: "en.*" is too aggressive and causes 429. Use specific variants.
            // en-orig = English (Original), en = English (Auto or standard)
            const priority = appLang === 'en' ? 'en-orig,en' : `${appLang},${appLang}-orig,en-orig,en`

            args.push('--write-subs', '--write-auto-subs', '--sub-langs', priority)
        } else {
            // Specific Language: Enable auto-subs fallback
            // This ensures if 'id' manual sub is missing, it grabs 'id' auto-generated sub
            args.push('--write-subs', '--write-auto-subs', '--sub-langs', lang)
        }

        // TOLERANCE: Don't fail the whole download if subtitles are missing/erroring
        args.push('--ignore-errors')

        // ANTI-BLOCK: Rate Limit Subtitle Requests (HTTP 429 Fix)
        // Add longer sleep interval (~7s) between subtitle downloads to look human
        // yt-dlp syntax: --sleep-subtitles min_sec  (random delay)
        args.push('--sleep-subtitles', '7')
        args.push('--sleep-requests', '3')

        // FIX: Do NOT embed subtitles if clipping (cutting) the video.
        // ffmpeg often fails to embed subtitles correctly into a cut stream, leading to errors.
        if (options.embedSubtitles && fmt !== 'audio' && !isClipping) {
            args.push('--embed-subs')
        }

        if (options.embedSubtitles) {
            // Safety: Force SRT to prevent muxing errors with ASS/VTT in MP4
            // This is critical for preventing "Alien Text" or burn-in failures
            args.push('--convert-subs', 'srt')
        } else if (options.subtitleFormat) {
            args.push('--convert-subs', options.subtitleFormat)
        }
    }

    // SponsorBlock: Check BOTH per-task option (from dialog) and global setting
    const useSponsorBlockNow = options.removeSponsors || settings.useSponsorBlock
    if (useSponsorBlockNow && settings.sponsorSegments.length > 0) {
        args.push('--sponsorblock-remove', settings.sponsorSegments.join(','))
    }

    // Livestream: Download from the start instead of current time
    if (options.liveFromStart) {
        args.push('--live-from-start')
    }

    // SEQUENTIAL MODE: If Audio Normalization is active, DO NOT split chapters yet.
    // We will do it in a second pass to avoid 403 errors.
    if (options.splitChapters && !options.audioNormalization) {
        args.push('--split-chapters')

        // Safety: Force subfolder to prevent file spam
        // Extract directory and filename from finalFilename (which is absolute)
        // We do naive string splitting because 'path' module isn't available in frontend easily without polyfills
        const lastSlash = Math.max(finalFilename.lastIndexOf('/'), finalFilename.lastIndexOf('\\'))
        if (lastSlash !== -1) {
            const dir = finalFilename.substring(0, lastSlash)
            const fileWithExt = finalFilename.substring(lastSlash + 1)
            const fileBase = fileWithExt.substring(0, fileWithExt.lastIndexOf('.')) || fileWithExt

            // New Template: /Dir/[Chapters] Filename/%(chapter_number)s - %(chapter)s.%(ext)s
            const chapterTemplate = `${dir}/[Chapters] ${fileBase}/%(chapter_number)s - %(chapter)s.%(ext)s`
            args.push('-o', chapterTemplate)
        }
    }

    if (settings.proxy) {
        // SECURITY: Prevent argument injection in proxy field
        if (settings.proxy.startsWith('-')) {
            throw new Error("Invalid Proxy: Cannot start with '-'")
        }
        args.push('--proxy', settings.proxy)
    }

    // Cookie Source logic
    // PRIORITY: 1. Task-specific Cookies (from Browser Extension) 2. System Browser 3. txt file
    if (options.cookies) {
        // If it looks like a file path (should probably be handled better, but for now extension sends CONTENT)
        // Wait, yt-dlp expects a FILE for cookies. We can't pass raw content via CLI arg easily without a temp file.
        // BUT, we can use stdin? No, yt-dlp doesn't support cookies viastdin easily.
        // It supports --cookies "file".
        // SO, if we receive RAW CONTENT, we must write it to a temp file first.
        // However, `buildYtDlpArgs` is pure logic. The writing should happen before calling this, providing a path?
        // OR the extension sends the path?
        // The extension cannot write files on user system (except download).
        // The LOCAL SERVER (Rust) receives the content. 
        // We should write it to a temp file in Rust or here in JS.
        // Let's assume options.cookies is a PATH to a temp file created by the caller (VideoSlice).
        args.push('--cookies', options.cookies)
    } else if (settings.cookieSource === 'browser') {
        const targetBrowser = settings.browserType || 'chrome';
        args.push('--cookies-from-browser', targetBrowser)
    } else if (settings.cookieSource === 'txt' && settings.cookiePath) {
        args.push('--cookies', settings.cookiePath)
    }

    // Custom User-Agent (to avoid shadowbans)
    // PRIORITY: 1. Task-specific UA 2. Settings
    if (options.userAgent) {
        args.push('--user-agent', options.userAgent)
    } else if (settings.userAgent === " ") {
        // User explicitly wants NO User-Agent (or default yt-dlp internal UA)
        console.log("User Agent disabled by user (Space detected)")
    } else {
        const defaultUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        const ua = (settings.userAgent && settings.userAgent.trim()) ? settings.userAgent.trim() : defaultUA;

        // SECURITY: Prevent argument injection in User-Agent
        if (ua.startsWith('-') || ua.includes('\n')) {
            console.warn("Invalid User-Agent detected (starts with - or contains newline), ignoring.")
        } else {
            args.push('--user-agent', ua)
        }
    }

    // Speed Limit (e.g. "5M", "500K")
    if (settings.speedLimit && settings.speedLimit.trim()) {
        const limit = settings.speedLimit.trim()
        // SECURITY: Prevent argument injection
        if (!limit.startsWith('-')) {
            args.push('--limit-rate', limit)
        }
    }

    // Embed Metadata (artist, title, etc. into file)
    // CRITICAL FIX: Disable metadata embedding for clips.
    // yt-dlp sees the original video duration (e.g. 20 min) and writes it to the file tags,
    // causing players to show "20:00" duration for a 10s clip.
    // NOTE: isClipping is already defined above in Hardware Acceleration logic.
    if (settings.embedMetadata && !isClipping) {
        args.push('--embed-metadata')
    }

    // Embed Thumbnail (cover art into file)
    // Embed Thumbnail (cover art into file)
    // FIX: Also disable thumbnail embedding for clips to prevent metadata/duration corruption
    if (settings.embedThumbnail && !isClipping) {
        args.push('--embed-thumbnail')
    }

    // Embed Chapters (markers)
    // FIX: Also disable for clips to unwanted chapter markers appearing outside the clipped range
    if (settings.embedChapters && !isClipping) {
        args.push('--embed-chapters')
    }

    // URL must be LAST, after all options
    args.push('--', url)

    return args
}

export function parseMetadata(lines: string[]) {
    let streamUrls: string[] = []
    let needsMerging = false
    let meta: any = null

    for (const line of lines) {
        try {
            const json = JSON.parse(line)

            // Extract Stream URLs
            if (json.requested_formats) {
                streamUrls = json.requested_formats.map((f: any) => f.url)
                if (json.requested_formats.length > 1) needsMerging = true
            } else if (json.url) {
                streamUrls = [json.url]
            }

            // Extract Metadata using the best available object
            if (json.title && json.id) meta = json
        } catch {
            // Non-JSON lines are expected (progress output), only log actual parse errors for JSON-like lines
            if (line.trim().startsWith('{')) {
                console.debug('[parseMetadata] Failed to parse JSON line:', line.substring(0, 100))
            }
        }
    }

    if (!meta) meta = { title: 'Unknown_Video', ext: 'mp4', id: 'unknown' }

    return { streamUrls, needsMerging, meta }
}

export function sanitizeFilename(template: string, meta: any): string {
    // Helper to sanitize individual path segments (folders/filenames)
    const sanitizeSegment = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_').replace(/\.\./g, '').trim()

    let finalName = template
    // Replace template variables first (so their content can be sanitized later)
    finalName = finalName.replace(/{title}/gi, meta.title || '')
    finalName = finalName.replace(/{ext}/gi, meta.ext || 'mp4')
    finalName = finalName.replace(/{id}/gi, meta.id || '')
    finalName = finalName.replace(/{uploader}/gi, meta.uploader || 'Unknown')
    finalName = finalName.replace(/{width}/gi, meta.width ? String(meta.width) : '')
    finalName = finalName.replace(/{height}/gi, meta.height ? String(meta.height) : '')

    // Handle Directory Structure:
    // Split by / or \ to preserve user-intended subfolders (e.g. "Series/Title")
    // Sanitize each segment individually to remove illegal chars
    const segments = finalName.split(/[/\\]/)
    finalName = segments.map(seg => sanitizeSegment(seg)).join('/')

    // Defense: Windows MAX_PATH limit (approx 260). Truncate to 200 to allow room for path + extension
    // Fix: We should check length AFTER joining, but apply truncation carefully not to break path structure?
    // For now, simpler safety: check total length. If too long, truncate LAST segment (filename).
    if (finalName.length > 200) {
        const parts = finalName.split('/')
        const lastPart = parts.pop() || ''
        const dirPart = parts.join('/')
        // Truncate filename part, preserving extension logic below will handle the rest
        const allowedLen = 200 - dirPart.length - 1
        if (allowedLen > 10) {
            parts.push(lastPart.substring(0, allowedLen))
            finalName = parts.join('/')
        } else {
            // Edge case: path too long, just truncate blindly
            finalName = finalName.substring(0, 200)
        }
    }

    // STRICT EXTENSION ENFORCEMENT
    const expectedExt = `.${meta.ext || 'mp4'}`

    // Case-insensitive check for extension (only on the last segment/filename)
    if (!finalName.toLowerCase().endsWith(expectedExt.toLowerCase())) {
        finalName = `${finalName}${expectedExt}`
    }

    // Fallback for completely empty names
    if (finalName === expectedExt || finalName.trim() === expectedExt) {
        finalName = sanitizeSegment(meta.title || 'Untitled').substring(0, 200) + expectedExt
    }

    return finalName
}

// Sidecar-based Command Factory
export async function getYtDlpCommand(args: string[], binaryPath?: string) {
    if (binaryPath && binaryPath.trim().length > 0) {
        // Use custom binary path (e.g. updated version in AppData)
        // Note: This requires the path to be allowed in tauri.conf.json shell capabilities
        return Command.create(binaryPath, args)
    }
    return Command.sidecar(BINARIES.YTDLP, args)
}


export function parseYtDlpJson(stdout: string) {
    const lines = stdout.split('\n')
    let parsedData = null

    // Try parsing each line from bottom up (JSON is usually last)
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim()
        if (!line || !line.startsWith('{')) continue

        try {
            parsedData = JSON.parse(line)
            if (parsedData.title) break // Found it
        } catch {
            // Not valid JSON
        }
    }

    if (parsedData) {
        // Robust Extraction Logic

        // 1. Thumbnail Fallback
        if (!parsedData.thumbnail && parsedData.thumbnails && Array.isArray(parsedData.thumbnails) && parsedData.thumbnails.length > 0) {
            // Pick the last one (usually highest quality in yt-dlp output)
            parsedData.thumbnail = parsedData.thumbnails[parsedData.thumbnails.length - 1].url
        }

        // 2. Playlist/Entries Fallback
        if (!parsedData.title && parsedData.entries && Array.isArray(parsedData.entries) && parsedData.entries.length > 0) {
            const firstEntry = parsedData.entries[0]
            parsedData.title = parsedData.title || firstEntry.title

            if (!parsedData.thumbnail) {
                parsedData.thumbnail = firstEntry.thumbnail
                if (!parsedData.thumbnail && firstEntry.thumbnails && Array.isArray(firstEntry.thumbnails)) {
                    parsedData.thumbnail = firstEntry.thumbnails[firstEntry.thumbnails.length - 1].url
                }
            }
        }

        // Detect Subtitles
        const hasManualSubs = parsedData.subtitles && Object.keys(parsedData.subtitles).length > 0
        const hasAutoSubs = parsedData.automatic_captions && Object.keys(parsedData.automatic_captions).length > 0
        parsedData.hasSubtitles = hasManualSubs || hasAutoSubs

        // Detect Live Status
        parsedData.is_live = parsedData.is_live || parsedData.was_live || false

        // Ensure chapters is available
        parsedData.chapters = parsedData.chapters || []

        return parsedData
    }

    // Fallback: Try finding substring if single line messed up
    const firstBrace = stdout.indexOf('{')
    if (firstBrace !== -1) {
        try {
            const potentialJson = stdout.substring(firstBrace)
            const data = JSON.parse(potentialJson)
            // Apply same robustness
            if (!data.thumbnail && data.thumbnails && Array.isArray(data.thumbnails)) {
                data.thumbnail = data.thumbnails[data.thumbnails.length - 1].url
            }

            const hasManualSubs = data.subtitles && Object.keys(data.subtitles).length > 0
            const hasAutoSubs = data.automatic_captions && Object.keys(data.automatic_captions).length > 0
            data.hasSubtitles = hasManualSubs || hasAutoSubs

            return data
        } catch { /* ignore */ }
    }

    // Fallback 2: Regex Extraction for critical fields if JSON fails completely
    // Sometimes yt-dlp outputs warning text mixed with JSON that breaks JSON.parse
    // We try to salvage enough to start the download.
    // IMPROVED REGEX: Handle escaped quotes inside the title
    const titleMatch = stdout.match(/"title":\s*"((?:[^"\\]|\\.)*)"/)
    const idMatch = stdout.match(/"id":\s*"([^"]+)"/)

    if (titleMatch && idMatch) {
        console.warn("JSON parsing failed, falling back to Regex extraction")
        return {
            title: titleMatch[1].replace(/\\"/g, '"'), // Unescape quotes
            id: idMatch[1],
            thumbnail: '', // Lost cause
            ext: 'mp4',
            hasSubtitles: false
        }
    }

    throw new Error("Invalid JSON output from yt-dlp")
}
// Clear local cache command
export async function clearCache() {
    const cmd = await getYtDlpCommand(['--rm-cache-dir'])
    const output = await cmd.execute()
    if (output.code !== 0) throw new Error(output.stderr)
    return true
}



export interface YtDlpProgressInfo {
    percent: number
    speed: string
    eta: string
    totalSize?: string
    isPostProcess?: boolean
    postProcessType?: 'merger' | 'extract' | 'convert' | 'fixup' | 'metadata'
}

/** Regex patterns for yt-dlp output parsing */
const PROGRESS_PATTERNS = {
    percent: /(\d+\.?\d*)%/,
    speed: /at\s+(\d+\.?\d*\w+\/s)/,
    eta: /ETA\s+(\S+)/,
    size: /of\s+([~0-9.]+\w+)/
}

/**
 * Parse yt-dlp stdout/stderr line for progress information
 * Returns null if line doesn't contain progress info
 */
export function parseYtDlpProgress(line: string): YtDlpProgressInfo | null {
    // Check for download progress
    if (line.includes('[download]')) {
        const percentMatch = line.match(PROGRESS_PATTERNS.percent)
        if (!percentMatch) return null

        const speedMatch = line.match(PROGRESS_PATTERNS.speed)
        const etaMatch = line.match(PROGRESS_PATTERNS.eta)
        const sizeMatch = line.match(PROGRESS_PATTERNS.size)

        return {
            percent: parseFloat(percentMatch[1]),
            speed: speedMatch ? speedMatch[1] : '-',
            eta: etaMatch ? etaMatch[1] : '-',
            totalSize: sizeMatch ? sizeMatch[1] : undefined
        }
    }

    // Check for post-processing stages
    if (line.includes('[Merger]')) {
        return { percent: 99, speed: '-', eta: '-', isPostProcess: true, postProcessType: 'merger' }
    }
    if (line.includes('[ExtractAudio]')) {
        return { percent: 99, speed: '-', eta: '-', isPostProcess: true, postProcessType: 'extract' }
    }
    if (line.includes('[VideoConvertor]')) {
        return { percent: 99, speed: '-', eta: '-', isPostProcess: true, postProcessType: 'convert' }
    }
    if (line.includes('[Fixup')) {
        return { percent: 99, speed: '-', eta: '-', isPostProcess: true, postProcessType: 'fixup' }
    }
    if (line.includes('[Metadata]')) {
        return { percent: 99, speed: '-', eta: '-', isPostProcess: true, postProcessType: 'metadata' }
    }

    return null
}

/**
 * Check if line contains an error
 */
export function isErrorLine(line: string): boolean {
    return line.includes('ERROR:') || line.includes('Traceback')
}

/**
 * Get post-process status detail text
 */
export function getPostProcessStatusText(type: YtDlpProgressInfo['postProcessType']): string {
    switch (type) {
        case 'merger': return 'Merging Audio + Video...'
        case 'extract': return 'Extracting Audio...'
        case 'convert': return 'Converting Format...'
        case 'fixup': return 'Fixing Container...'
        case 'metadata': return 'Writing Metadata...'
        default: return 'Processing...'
    }
}
