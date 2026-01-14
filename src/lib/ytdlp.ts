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
}

export async function buildYtDlpArgs(
    url: string, 
    options: YtDlpOptions, 
    settings: AppSettings, 
    finalFilename: string,
    gpuType: 'cpu' | 'nvidia' | 'amd' | 'intel' | 'apple' = 'cpu'
): Promise<string[]> {
    const args: string[] = [
        '-o', finalFilename, // Full path included in finalFilename
        '--newline', 
        '--no-colors',
        '--no-playlist',
        '--encoding', 'utf-8', // Force UTF-8 output to prevent Tauri shell encoding errors
        // CONCURRENT FRAGMENTS (Speed Boost)
        '-N', String(Math.max(1, settings.concurrentFragments || 4)),
        '--continue', // Force resume support
        '--socket-timeout', DEFAULTS.SOCKET_TIMEOUT, // Refresh link if connection hangs/throttles
    ]

    const fmt = options.format || settings.resolution
    const container = options.container || settings.container || 'mp4'

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
        if (options.audioNormalization) {
            // Use EBU R128 standard: Integrated Loudness -16 LUFS, True Peak -1.5 dBTP
            // We use a complex filter chain via postprocessor arguments
            args.push('--postprocessor-args', 'ffmpeg:-af loudnorm=I=-16:TP=-1.5:LRA=11')
        }

    } else if (fmt === 'gif') {
        // OPTIMIZED GIF MODE
        // Strategy: Download video first, then convert to GIF using a high-quality filter chain.
        
        args.push('-S', 'res:720,ext:mp4,fps:30') // Limit source to 720p30 for sanity
        
        const fps = options.gifFps || 15
        const scaleHeight = options.gifScale || 480
        
        // SMART SCALING: "Scale Down Only"
        // If source height (ih) > target (scaleHeight), scale to target.
        // If source height (ih) <= target, keep original (ih).
        // syntax: scale=-2:'min(480,ih)'
        // -2 ensures width is even (required for some codecs), -1 keeps aspect ratio
        const scaleFilter = scaleHeight > 0 
            ? `,scale=-2:'min(${scaleHeight},ih)':flags=lanczos` 
            : ''
        
        let gifFilter = ""
        
        if (options.gifQuality === 'high') {
             // Palette Gen (High Quality, Slow)
             // split[s0][s1]: Split stream into two for palette generation
             // [s0]palettegen[p]: Generate palette from first stream
             // [s1][p]paletteuse: Apply palette to second stream
             gifFilter = `fps=${fps}${scaleFilter},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
        } else {
             // Fast Mode (Standard Dither, No Palette Gen)
             // Just FPS and Scale
             gifFilter = `fps=${fps}${scaleFilter}`
        }

        // Use yt-dlp's VideoConvertor post-processor to handle the conversion.
        // This avoids double-invoking ffmpeg and lets yt-dlp manage the temp files.
        args.push('--recode-video', 'gif')
        args.push('--postprocessor-args', `VideoConvertor:-vf "${gifFilter}" -loop 0`)


    } else {
        let h = ''
        if (fmt !== 'Best' && fmt !== 'audio') {
            // If explicit resolution (360, 720, 1080, etc)
            h = `[height<=${fmt}]`
        }

        // Codec Logic
        const codec = options.videoCodec || 'auto'
        let formatString = ''

        if (codec === 'h264') {
            formatString = `bestvideo${h}[vcodec^=avc]+bestaudio[ext=m4a]/best${h}[ext=mp4]/best`
        } else if (codec === 'av1') {
            formatString = `bestvideo${h}[vcodec^=av01]+bestaudio/bestvideo${h}[vcodec^=vp9]+bestaudio/best`
        } else if (codec === 'vp9') {
            formatString = `bestvideo${h}[vcodec^=vp9]+bestaudio/best`
        } else if (codec === 'hevc') {
            formatString = `bestvideo${h}[vcodec^=hevc]+bestaudio/bestvideo${h}[vcodec^=hev1]+bestaudio/bestvideo${h}[vcodec^=hvc1]+bestaudio/best`
        } else {
            // Auto / Best (Default)
            formatString = `bestvideo${h}+bestaudio/best${h}/best`
        }

        args.push('-f', formatString)
        
        // Transcoding Logic (Honest Mode)
        // If forceTranscode is true (determined by frontend checking metadata), we MUST convert.
        if (options.forceTranscode && codec !== 'auto') {
            let transcodeArgs = ''
            
            // Audio Copy (-c:a copy) preserves original audio quality
            if (codec === 'h264') {
                transcodeArgs = '-c:v libx264 -crf 23 -preset medium -c:a copy'
            } else if (codec === 'av1') {
                // Use SVT-AV1 (Faster) if available, standard ffmpeg builds usually have it
                // CRF 35 in AV1 is roughly visual equivalent to CRF 23 in H264
                transcodeArgs = '-c:v libsvtav1 -crf 30 -preset 8 -c:a copy' 
            } else if (codec === 'vp9') {
                transcodeArgs = '-c:v libvpx-vp9 -crf 30 -b:v 0 -c:a copy'
            } else if (codec === 'hevc') {
                transcodeArgs = '-c:v libx265 -crf 26 -preset medium -c:a copy'
            }
            
            if (transcodeArgs) {
                 args.push('--postprocessor-args', `VideoConvertor:${transcodeArgs}`)
            }
        }
        
        // MAGIC REMUX: Ensure output is always the desired container (mp4/mkv)
        args.push('--merge-output-format', container)
        
        // Apply Audio Normalization to Video too if requested
        if (options.audioNormalization) {
             args.push('--postprocessor-args', 'ffmpeg:-af loudnorm=I=-16:TP=-1.5:LRA=11')
        }
    }

    // Clipping support using yt-dlp's native download-sections
    if (options.rangeStart || options.rangeEnd) {
        // Robustness: Sanitize input to prevent argument injection
        // Only allow numbers, dots, and colons (00:00:00 format or 123.45)
        const sanitizeTime = (t: string | number) => String(t).replace(/[^0-9:.]/g, '')

        const start = options.rangeStart ? sanitizeTime(options.rangeStart) : '0'
        const end = options.rangeEnd ? sanitizeTime(options.rangeEnd) : 'inf'
        
        args.push('--download-sections', `*${start}-${end}`)
        args.push('--force-keyframes-at-cuts') // Clean cuts

        // FIX: Incorrect Duration Metadata
        // Force ffmpeg downloader for smarter header rewriting
        // NOTE: We do NOT force re-encode args here anymore to avoid quality loss.
        // We let yt-dlp/ffmpeg handle the cut naturally.
        // Removing 'android' client ensures we get high quality source.
        // REMOVED: args.push('--downloader', 'ffmpeg')
        // Reason: Using ffmpeg as downloader conflicts with subtitle extraction/embedding in yt-dlp for some containers.
        // yt-dlp will automatically use ffmpeg for the cut via "download-sections" without needing this forced override.
        
        // Ensure timestamps are reset to 0, metadata is cleaned, and moov atom is moved to front
        // FIX: faststart is invalid for GIF, only apply for video containers
        if (fmt !== 'gif') {
            // FIX: Removed "-map_metadata 0" as it can cause issues if source metadata is complex during cut
            args.push('--postprocessor-args', 'ffmpeg:-movflags +faststart -avoid_negative_ts make_zero')
        } else {
             args.push('--postprocessor-args', 'ffmpeg:-avoid_negative_ts make_zero -map_metadata 0')
        }
    }

    // Hardware Acceleration Logic
    // FIX: Disable HW Accel during clipping to prevent 'pecah-pecah' (corruption) artifacting.
    // ffmpeg re-encoding with NVENC/AMF during a download stream cut often fails to handle keyframes correctly.
    const isClipping = !!(options.rangeStart || options.rangeEnd)
    
    // Hardware Acceleration Logic
    // FIX: Use "Smart NVENC" for clips: Forced IDR at start + High Bitrate to prevent artifacts/corruption
    // This allows using GPU (Fast) while maintaining CPU-like stability for cuts.
    
    // 1. Check User Preference
    let activeGpuType = gpuType
    if (settings.hardwareDecoding === 'cpu') {
        activeGpuType = 'cpu'
    } else if (settings.hardwareDecoding === 'gpu' && gpuType === 'cpu') {
        // User forced GPU but system says none? Try NVIDIA as default guess or keep CPU if safer
        // We'll trust system detection properly here to avoid crashes
        console.warn("User forced GPU but none detected. Falling back to CPU for safety.")
    }

    // FIX: If forceTranscode is on AND we are clipping, skip HW downloader args.
    // The VideoConvertor post-processor (line 157) will handle the encoding.
    // Adding HW downloader args would create conflicting FFmpeg pipelines.
    if (activeGpuType !== 'cpu' && fmt !== 'audio' && !(options.forceTranscode && isClipping)) {
        const encoderMap: Record<string, string> = {
            'nvidia': 'h264_nvenc',
            'amd': 'h264_amf',
            'intel': 'h264_qsv',
            'apple': 'h264_videotoolbox'  // macOS hardware encoding
        }
        const encoder = encoderMap[activeGpuType]
        
        if (encoder) {
            let hwArgs = `ffmpeg:-c:v ${encoder}`
            
            // If clipping (cutting video), invoke "Smart Mode" to prevent glitches
            // isClipping is already defined in outer scope
            if (isClipping) {
                // OPTIMIZATION: Use CQP/CRF (Constant Quality) instead of Fixed Bitrate
                // This is more efficient and provides better consistency across different content complexities.
                
                // Target: "Visually Lossless" enough for editing (CRF 18-23 equivalent)
                
                if (activeGpuType === 'nvidia') {
                    // NVENC: Use -cq (Constant Quality)
                    // 19 is a good sweetspot for 1080p/4K. Lower is better quality.
                    // -forced-idr 1 is kept for clean cuts.
                    // -preset p4 is balanced.
                    hwArgs += ` -rc:v vbr -cq:v 19 -preset p4 -forced-idr 1`
                } else if (activeGpuType === 'amd') {
                    // AMF: Use -rc cqp -qp_i 22. AMD usually needs slightly higher QP for same size
                    hwArgs += ` -rc cqp -qp_i 22 -qp_p 22`
                } else if (activeGpuType === 'intel') {
                    // QSV: Use -global_quality (ICQ). Scale 1-51? ICQ 20 is around CRF 23.
                    hwArgs += ` -global_quality 20`
                } else if (activeGpuType === 'apple') {
                    // VideoToolbox: -q:v 60 (Scale 1-100, 100 best)
                    hwArgs += ` -q:v 65`
                } else {
                    // Unknown/Software Fallback (shouldn't happen here due to outer check, but safe fallback)
                    // Force high bitrate for safety if encoder specific flags unknown
                    hwArgs += ` -b:v 10M`
                }
            }

            args.push('--downloader-args', hwArgs)
        }
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
    
    // Cookie Source logic (System Browser)
    if (settings.cookieSource === 'browser') {
        const targetBrowser = settings.browserType || 'chrome';
        args.push('--cookies-from-browser', targetBrowser)
    } else if (settings.cookieSource === 'txt' && settings.cookiePath) {
        args.push('--cookies', settings.cookiePath)
    }

    // Custom User-Agent (to avoid shadowbans)
    // IMPORTER MODE LOGIC:
    // 1. If user types " " (Space), disable UA completely (send nothing).
    // 2. If user types specific UA, use it.
    // 3. If empty, use Default Imposter Mode (Chrome).
    
    if (settings.userAgent === " ") {
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
                streamUrls = json.requested_formats.map((f:any) => f.url)
                if (json.requested_formats.length > 1) needsMerging = true
            } else if (json.url) {
                streamUrls = [json.url]
            }

            // Extract Metadata using the best available object
            if (json.title && json.id) meta = json
        } catch (e) {
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
    const sanitize = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_').replace(/\.\./g, '').trim()
    
    let finalName = template
    finalName = finalName.replace(/{title}/g, meta.title || '')
    finalName = finalName.replace(/{ext}/g, meta.ext || 'mp4')
    finalName = finalName.replace(/{id}/g, meta.id || '')
    finalName = finalName.replace(/{uploader}/g, meta.uploader || 'Unknown')
    finalName = finalName.replace(/{width}/g, meta.width ? String(meta.width) : '')
    finalName = finalName.replace(/{height}/g, meta.height ? String(meta.height) : '')
    
    finalName = sanitize(finalName)
    // Defense: Windows MAX_PATH limit (approx 260). Truncate to 200 to allow room for path + extension
    if (finalName.length > 200) {
        finalName = finalName.substring(0, 200)
    }

    // STRICT EXTENSION ENFORCEMENT
    // Ensure the filename actually ends with the expected extension.
    // This fixes issues where templates like "{title}{ext}" result in "VideoNamemp4" (no dot),
    // causing ffmpeg "Invalid Argument" errors because it can't detect the format.
    const expectedExt = `.${meta.ext || 'mp4'}`
    
    // Case-insensitive check for extension
    if (!finalName.toLowerCase().endsWith(expectedExt.toLowerCase())) {
        // Warning: This might duplicate extension if file is "Video.mp4" and ext is "MP4" 
        // but sanitization above usually handles case. 
        // We'll trust the meta.ext is correct source of truth.
        finalName = `${finalName}${expectedExt}`
    }
    
    // Fallback for completely empty names
    if (finalName === expectedExt) {
         finalName = sanitize(meta.title || 'Untitled').substring(0, 200) + expectedExt
    }
    
    return finalName
}

// Sidecar-based Command Factory
export async function getYtDlpCommand(args: string[]) {
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
        } catch (e) {
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
        } catch (e) { /* ignore */ }
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
    try {
        const cmd = await getYtDlpCommand(['--rm-cache-dir'])
        const output = await cmd.execute()
        if (output.code !== 0) throw new Error(output.stderr)
        return true
    } catch (e) {
        throw e
    }
}

// =============================================================================
// Progress Parsing (Type-Safe)
// =============================================================================

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
