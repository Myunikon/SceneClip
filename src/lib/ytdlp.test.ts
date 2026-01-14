/**
 * Unit Tests for ytdlp.ts
 * Tests the core yt-dlp argument builder and helper functions
 */
import { describe, it, expect } from 'vitest'
import { buildYtDlpArgs, sanitizeFilename, parseYtDlpJson, parseMetadata, YtDlpOptions } from './ytdlp'
import { AppSettings } from '../store/slices/types'

// Mock default settings
const createMockSettings = (overrides: Partial<AppSettings> = {}): AppSettings => ({
    theme: 'dark',
    language: 'en',
    launchAtStartup: false,
    startMinimized: false,
    closeAction: 'minimize',
    hasSeenOnboarding: true,
    downloadPath: '/downloads',
    alwaysAskPath: false,
    filenameTemplate: '{title}.{ext}',
    resolution: 'Best',
    container: 'mp4',
    concurrentDownloads: 3,
    concurrentFragments: 4,
    speedLimit: '',
    proxy: '',
    userAgent: '',
    lowPerformanceMode: false,
    cookieSource: 'none',
    useSponsorBlock: false,
    sponsorSegments: [],
    binaryPathYtDlp: '',
    binaryPathFfmpeg: '',
    embedMetadata: true,
    embedThumbnail: false,
    embedChapters: false,
    postDownloadAction: 'none',
    developerMode: false,
    frontendFontSize: 'medium',
    quickDownloadEnabled: false,
    showQuickModeButton: false,
    lastDownloadOptions: null,
    hardwareDecoding: 'auto',
    audioNormalization: false,
    ...overrides
})

describe('buildYtDlpArgs', () => {
    it('should include basic required arguments', async () => {
        const settings = createMockSettings()
        const args = await buildYtDlpArgs('https://youtube.com/watch?v=test', {}, settings, '/downloads/test.mp4')
        
        expect(args).toContain('-o')
        expect(args).toContain('/downloads/test.mp4')
        expect(args).toContain('--newline')
        expect(args).toContain('--no-colors')
        expect(args).toContain('--no-playlist')
        expect(args).toContain('--continue')
    })

    it('should use custom concurrent fragments setting', async () => {
        const settings = createMockSettings({ concurrentFragments: 8 })
        const args = await buildYtDlpArgs('https://youtube.com/watch?v=test', {}, settings, 'test.mp4')
        
        const nIndex = args.indexOf('-N')
        expect(nIndex).toBeGreaterThan(-1)
        expect(args[nIndex + 1]).toBe('8') // Should use the setting value
    })

    it('should set correct audio format for audio-only downloads', async () => {
        const settings = createMockSettings()
        const args = await buildYtDlpArgs('https://youtube.com/watch?v=test', { format: 'audio', audioBitrate: '320' }, settings, 'test.mp3')
        
        expect(args).toContain('-x')
        expect(args).toContain('--audio-format')
        expect(args).toContain('mp3')
        expect(args).toContain('--audio-quality')
        expect(args).toContain('0') // 320kbps = quality 0
    })

    it('should handle video codec preferences correctly', async () => {
        const settings = createMockSettings()
        
        // H.264 codec
        const h264Args = await buildYtDlpArgs('https://youtube.com/watch?v=test', { videoCodec: 'h264' }, settings, 'test.mp4')
        const h264Format = h264Args[h264Args.indexOf('-f') + 1]
        expect(h264Format).toContain('avc')
        
        // AV1 codec
        const av1Args = await buildYtDlpArgs('https://youtube.com/watch?v=test', { videoCodec: 'av1' }, settings, 'test.mp4')
        const av1Format = av1Args[av1Args.indexOf('-f') + 1]
        expect(av1Format).toContain('av01')
    })

    it('should add clipping arguments when range is specified', async () => {
        const settings = createMockSettings()
        const args = await buildYtDlpArgs('https://youtube.com/watch?v=test', { rangeStart: '00:30', rangeEnd: '01:00' }, settings, 'test.mp4')
        
        expect(args).toContain('--download-sections')
        expect(args).toContain('*00:30-01:00')
        expect(args).toContain('--force-keyframes-at-cuts')
        // NOTE: --downloader ffmpeg was intentionally removed (see ytdlp.ts line 187-189)
        // It conflicts with subtitle embedding in some containers.
    })

    it('should sanitize time inputs to prevent injection', async () => {
        const settings = createMockSettings()
        // Attempt to inject malicious characters - sanitizer only keeps [0-9:.]
        const args = await buildYtDlpArgs('https://youtube.com/watch?v=test', { rangeStart: '00:30; rm -rf /', rangeEnd: '01:00' }, settings, 'test.mp4')
        
        // Check that the download-sections argument exists and is sanitized
        const sectionsIndex = args.indexOf('--download-sections')
        expect(sectionsIndex).toBeGreaterThan(-1)
        const sectionsValue = args[sectionsIndex + 1]
        // Should not contain semicolon, space, or slash
        expect(sectionsValue).not.toContain(';')
        expect(sectionsValue).not.toContain(' ')
        expect(sectionsValue).not.toContain('/')
        expect(sectionsValue).toBe('*00:30-01:00') // Only numbers, colons, and dots kept
    })

    it('should reject proxy strings starting with dash', async () => {
        const settings = createMockSettings({ proxy: '-x malicious' })
        
        await expect(buildYtDlpArgs('https://youtube.com/watch?v=test', {}, settings, 'test.mp4'))
            .rejects.toThrow("Invalid Proxy")
    })

    it('should add subtitle arguments when enabled', async () => {
        const settings = createMockSettings()
        const args = await buildYtDlpArgs('https://youtube.com/watch?v=test', { 
            subtitles: true, 
            subtitleLang: 'en',
            embedSubtitles: true 
        }, settings, 'test.mp4')
        
        expect(args).toContain('--write-subs')
        expect(args).toContain('--sub-langs')
        expect(args).toContain('en')
        expect(args).toContain('--embed-subs')
    })

    it('should add SponsorBlock arguments when enabled', async () => {
        const settings = createMockSettings({ 
            useSponsorBlock: true, 
            sponsorSegments: ['sponsor', 'intro'] 
        })
        const args = await buildYtDlpArgs('https://youtube.com/watch?v=test', {}, settings, 'test.mp4')
        
        expect(args).toContain('--sponsorblock-remove')
        expect(args).toContain('sponsor,intro')
    })

    it('should place URL last with -- separator', async () => {
        const settings = createMockSettings()
        const testUrl = 'https://youtube.com/watch?v=test1234'
        const args = await buildYtDlpArgs(testUrl, {}, settings, 'test.mp4')
        
        expect(args[args.length - 1]).toBe(testUrl)
        expect(args[args.length - 2]).toBe('--')
    })
})

describe('buildYtDlpArgs GPU Acceleration', () => {
    const settings = createMockSettings()
    const url = 'https://youtube.com/watch?v=test'

    it('should inject nvidia encoder args when gpuType is nvidia', async () => {
        const args = await buildYtDlpArgs(url, {}, settings, 'test.mp4', 'nvidia')
        expect(args).toContain('--downloader-args')
        expect(args).toContain('ffmpeg:-c:v h264_nvenc')
    })

    it('should inject amd encoder args when gpuType is amd', async () => {
        const args = await buildYtDlpArgs(url, {}, settings, 'test.mp4', 'amd')
        expect(args).toContain('--downloader-args')
        expect(args).toContain('ffmpeg:-c:v h264_amf')
    })

    it('should inject intel encoder args when gpuType is intel', async () => {
        const args = await buildYtDlpArgs(url, {}, settings, 'test.mp4', 'intel')
        expect(args).toContain('--downloader-args')
        expect(args).toContain('ffmpeg:-c:v h264_qsv')
    })

    it('should NOT inject encoder args when gpuType is cpu', async () => {
        const args = await buildYtDlpArgs(url, {}, settings, 'test.mp4', 'cpu')
        expect(args).not.toContain('--downloader-args')
    })
})

describe('sanitizeFilename', () => {
    it('should remove illegal filesystem characters', () => {
        const meta = { title: 'Test:Video*Name?', ext: 'mp4', id: '123' }
        const result = sanitizeFilename('{title}.{ext}', meta)
        
        expect(result).not.toContain(':')
        expect(result).not.toContain('*')
        expect(result).not.toContain('?')
        expect(result).toContain('Test_Video_Name_')
    })

    it('should replace template variables correctly', () => {
        const meta = { title: 'My Video', ext: 'mkv', id: 'abc123', uploader: 'Channel' }
        const result = sanitizeFilename('{title}-{id}.{ext}', meta)
        
        expect(result).toBe('My Video-abc123.mkv')
    })

    it('should handle empty title with fallback', () => {
        const meta = { title: '', ext: 'mp4', id: '123' }
        const result = sanitizeFilename('{title}.{ext}', meta)
        
        // Updated: sanitizeFilename now returns 'Untitled' for empty titles as a safety fallback
        expect(result).toBe('Untitled.mp4')
    })

    it('should remove path traversal attempts', () => {
        const meta = { title: '../../../etc/passwd', ext: 'mp4', id: '123' }
        const result = sanitizeFilename('{title}.{ext}', meta)
        
        expect(result).not.toContain('..')
    })
    
    it('should sanitize colons in filenames to underscores', () => {
        const meta = { title: 'Avengers: Endgame', ext: 'mp4' }
        const result = sanitizeFilename('{title}.{ext}', meta)
        expect(result).toBe('Avengers_ Endgame.mp4')
    })
    
    it('should force extension if template is malformed (missing dot)', () => {
        const meta = { title: 'cool_video', ext: 'mp4', id: '123' }
        // Malformed template: missing dot between title and ext
        const result = sanitizeFilename('{title}{ext}', meta)
        
        // Should detect that "cool_videomp4" doesn't end with ".mp4" and append it
        expect(result).toBe('cool_videomp4.mp4')
    })

    it('should force extension even if simple string', () => {
        const meta = { title: 'video', ext: 'mp4' }
        const result = sanitizeFilename('my_video', meta)
        expect(result).toBe('my_video.mp4')
    })
})

describe('parseYtDlpJson', () => {
    it('should parse valid JSON output', () => {
        const stdout = `[info] Extracting information
{"title": "Test Video", "id": "abc123", "thumbnail": "https://example.com/thumb.jpg"}`
        
        const result = parseYtDlpJson(stdout)
        
        expect(result.title).toBe('Test Video')
        expect(result.id).toBe('abc123')
        expect(result.thumbnail).toBe('https://example.com/thumb.jpg')
    })

    it('should extract thumbnail from thumbnails array as fallback', () => {
        const stdout = `{"title": "Test", "id": "123", "thumbnails": [{"url": "low.jpg"}, {"url": "high.jpg"}]}`
        
        const result = parseYtDlpJson(stdout)
        
        expect(result.thumbnail).toBe('high.jpg') // Last one = highest quality
    })

    it('should throw error on invalid JSON', () => {
        const stdout = 'This is not JSON at all'
        
        expect(() => parseYtDlpJson(stdout)).toThrow('Invalid JSON output')
    })
})

describe('parseMetadata', () => {
    it('should extract stream URLs from requested_formats', () => {
        const lines = [
            '{"title": "Test", "id": "123", "requested_formats": [{"url": "video.mp4"}, {"url": "audio.mp4"}]}'
        ]
        
        const result = parseMetadata(lines)
        
        expect(result.streamUrls).toEqual(['video.mp4', 'audio.mp4'])
        expect(result.needsMerging).toBe(true)
    })

    it('should return fallback meta when no valid JSON found', () => {
        const lines = ['not json', 'also not json']
        
        const result = parseMetadata(lines)
        
        expect(result.meta.title).toBe('Unknown_Video')
        expect(result.meta.ext).toBe('mp4')
    })
})

describe('buildYtDlpArgs UI Permutations (New Download Dialog)', () => {
    const settings = createMockSettings()
    const url = 'https://youtube.com/watch?v=permutation'

    // 1. GIF MODE
    it('should generate correct GIF args with defaults', async () => {
        // User selects GIF but doesn't touch advanced settings (defaults undefined)
        const args = await buildYtDlpArgs(url, { format: 'gif' }, settings, 'test.gif')
        
        expect(args).toContain('--recode-video')
        expect(args).toContain('gif')
        // Should have filter chain
        const postProc = args.indexOf('--postprocessor-args')
        expect(postProc).toBeGreaterThan(-1)
        expect(args[postProc + 1]).toContain('VideoConvertor:-vf')
        // Default FPS 15
        expect(args[postProc + 1]).toContain('fps=15')
    })

    it('should generate correct GIF args with High Quality', async () => {
        const args = await buildYtDlpArgs(url, { format: 'gif', gifQuality: 'high', gifFps: 24, gifScale: 320 }, settings, 'test.gif')
        const ppArgs = args[args.indexOf('--postprocessor-args') + 1]
        
        expect(ppArgs).toContain('palettegen') // High quality uses palettegen
        expect(ppArgs).toContain('fps=24')
        expect(ppArgs).toContain('scale=-2:\'min(320,ih)\'') 
    })

    // 2. AUDIO MODE
    it('should handle Audio Mode with default bitrate', async () => {
        // User selects Audio, undefined bitrate
        const args = await buildYtDlpArgs(url, { format: 'audio' }, settings, 'test.mp3')
        
        expect(args).toContain('--audio-quality')
        expect(args[args.indexOf('--audio-quality') + 1]).toBe('2') // Default 192k -> quality 2
    })

    it('should handle Audio Mode with specific bitrate', async () => {
        // 320kbps
        const args = await buildYtDlpArgs(url, { format: 'audio', audioBitrate: '320' }, settings, 'test.mp3')
        expect(args[args.indexOf('--audio-quality') + 1]).toBe('0') // 320k -> 0
        
        // 128kbps
        const args2 = await buildYtDlpArgs(url, { format: 'audio', audioBitrate: '128' }, settings, 'test.mp3')
        expect(args2[args2.indexOf('--audio-quality') + 1]).toBe('5') // 128k -> 5
    })

    it('should inject Loudness Normalization for audio', async () => {
        const args = await buildYtDlpArgs(url, { format: 'audio', audioNormalization: true }, settings, 'test.mp3')
        expect(args).toContain('--postprocessor-args')
        expect(args.some(a => a.includes('loudnorm=I=-16'))).toBe(true)
    })

    // 3. VIDEO CODECS
    it('should request AV1 codec when selected', async () => {
        const args = await buildYtDlpArgs(url, { videoCodec: 'av1' }, settings, 'test.mp4')
        const fmt = args[args.indexOf('-f') + 1]
        expect(fmt).toContain('vcodec^=av01')
    })

    it('should request VP9 codec when selected', async () => {
        const args = await buildYtDlpArgs(url, { videoCodec: 'vp9' }, settings, 'test.webm')
        const fmt = args[args.indexOf('-f') + 1]
        expect(fmt).toContain('vcodec^=vp9')
    })

    // 4. SPONSORBLOCK & CHAPTERS
    it('should add sponsorblock args', async () => {
        const args = await buildYtDlpArgs(url, { removeSponsors: true }, createMockSettings({ sponsorSegments: ['sponsor'] }), 'test.mp4')
        expect(args).toContain('--sponsorblock-remove')
        expect(args).toContain('sponsor')
    })

    it('should split chapters with sanitized output template', async () => {
        const args = await buildYtDlpArgs(url, { splitChapters: true }, settings, '/abs/path/to/test.mp4')
        expect(args).toContain('--split-chapters')
        // Check new output template for chapters
        const outIndex = args.lastIndexOf('-o') // It overrides existing -o
        expect(outIndex).toBeGreaterThan(-1)
        expect(args[outIndex + 1]).toContain('[Chapters] test')
        expect(args[outIndex + 1]).toContain('%(chapter_number)s')
    })
})

describe('buildYtDlpArgs Advanced Scenarios', () => {
    const settings = createMockSettings()
    const url = 'https://youtube.com/watch?v=advanced'

    // 1. NETWORK SETTINGS
    it('should inject proxy if configured', async () => {
        const proxySettings = createMockSettings({ proxy: 'http://user:pass@1.2.3.4:8080' })
        const args = await buildYtDlpArgs(url, {}, proxySettings, 'test.mp4')
        expect(args).toContain('--proxy')
        expect(args).toContain('http://user:pass@1.2.3.4:8080')
    })

    it('should inject cookies from browser', async () => {
        const cookieSettings = createMockSettings({ cookieSource: 'browser', browserType: 'firefox' })
        const args = await buildYtDlpArgs(url, {}, cookieSettings, 'test.mp4')
        expect(args).toContain('--cookies-from-browser')
        expect(args).toContain('firefox')
    })

    it('should inject cookies from file', async () => {
        const cookieSettings = createMockSettings({ cookieSource: 'txt', cookiePath: '/path/to/cookies.txt' })
        const args = await buildYtDlpArgs(url, {}, cookieSettings, 'test.mp4')
        expect(args).toContain('--cookies')
        expect(args).toContain('/path/to/cookies.txt')
    })

    it('should apply speed limit', async () => {
        const speedSettings = createMockSettings({ speedLimit: '5M' })
        const args = await buildYtDlpArgs(url, {}, speedSettings, 'test.mp4')
        expect(args).toContain('--limit-rate')
        expect(args).toContain('5M')
    })

    it('should handle User-Agent customization', async () => {
        // Custom UA
        const uaSettings = createMockSettings({ userAgent: 'Mozilla/TestAgent' })
        const args = await buildYtDlpArgs(url, {}, uaSettings, 'test.mp4')
        const uaIndex = args.indexOf('--user-agent')
        expect(uaIndex).toBeGreaterThan(-1)
        expect(args[uaIndex + 1]).toBe('Mozilla/TestAgent')

        // Disabled UA (Space hack)
        const noUaSettings = createMockSettings({ userAgent: ' ' })
        const args2 = await buildYtDlpArgs(url, {}, noUaSettings, 'test.mp4')
        expect(args2).not.toContain('--user-agent')
    })

    // 2. CLIPPING SAFETY (CRITICAL)
    it('should DISABLE metadata embedding when clipping to prevent corruption', async () => {
        // Enable all embedding options in settings
        const embedSettings = createMockSettings({ 
            embedMetadata: true, 
            embedChapters: true, 
            embedThumbnail: true 
        })
        
        // Clipping enabled
        const args = await buildYtDlpArgs(url, { rangeStart: '00:10', rangeEnd: '00:20' }, embedSettings, 'clip.mp4')
        
        // Metadata args should be ABSENT
        expect(args).not.toContain('--embed-metadata')
        expect(args).not.toContain('--embed-chapters')
        expect(args).not.toContain('--embed-thumbnail')
        
        // Should have download sections
        expect(args).toContain('--download-sections')
    })

    // 3. HARDWARE ACCELERATION SPECIFICS
    it('should use Intel QSV flags with ICQ mode during clipping', async () => {
        // ICQ mode (-global_quality) is only applied during clipping for quality consistency
        const args = await buildYtDlpArgs(url, { rangeStart: '10' }, settings, 'test.mp4', 'intel')
        const dlArgs = args[args.indexOf('--downloader-args') + 1]
        expect(dlArgs).toContain('h264_qsv')
        expect(dlArgs).toContain('-global_quality') // ICQ mode for clips
    })

    it('should use AMD AMF flags with clipping optimization', async () => {
        // AMF with clipping triggers specific rate control
        const args = await buildYtDlpArgs(url, { rangeStart: '10' }, settings, 'test.mp4', 'amd')
        const dlArgs = args[args.indexOf('--downloader-args') + 1]
        expect(dlArgs).toContain('h264_amf')
        expect(dlArgs).toContain('-rc cqp') // Constant Quality
    })

    it('should use Apple VideoToolbox flags', async () => {
        const args = await buildYtDlpArgs(url, {}, settings, 'test.mp4', 'apple')
        const dlArgs = args[args.indexOf('--downloader-args') + 1]
        expect(dlArgs).toContain('h264_videotoolbox')
    })

    // 4. LIVESTREAM
    it('should add live-from-start flag', async () => {
        const args = await buildYtDlpArgs(url, { liveFromStart: true }, settings, 'live.mp4')
        expect(args).toContain('--live-from-start')
    })

    // -------------------------------------------------------------------------
    // 8. 403 Error Investigation (Split + Loudnorm)
    // -------------------------------------------------------------------------
    it('should generate valid args for Split Chapters + Audio Normalization', async () => {
        const settings = createMockSettings({
            audioNormalization: true // Global setting
        });
        const options: YtDlpOptions = {
            splitChapters: true,
            audioNormalization: true, // Task setting
        };
        
        const args = await buildYtDlpArgs('https://youtube.com/watch?v=video', options, settings, 'C:/Downloads/video.mp4', 'cpu');
        
        // SEQUENTIAL MODE CHECK:
        // When both are enabled, buildYtDlpArgs should SKIP adding --split-chapters
        // to avoid the 403 error. The splitting happens in a second pass in createVideoSlice.
        expect(args).not.toContain('--split-chapters');

        // Check for Loudnorm (should still be there as it runs on the main file)
        const ppIndex = args.findIndex(a => a.includes('loudnorm=I=-16:TP=-1.5:LRA=11'));
        expect(ppIndex).toBeGreaterThan(-1);
        
        // Ensure no conflicting downloader args (like forced ffmpeg downloader which causes header issues)
        expect(args).not.toContain('--downloader');
        expect(args.join(' ')).not.toContain('--downloader ffmpeg');
    });

    // 5. HARDWARE ACCELERATION FALLBACKS (Safety Checks)
    it('should fall back to CPU if User wants GPU but System detects CPU', async () => {
        const gpuSettings = createMockSettings({ hardwareDecoding: 'gpu' })
        // System reports 'cpu' (4th arg)
        const args = await buildYtDlpArgs(url, {}, gpuSettings, 'test.mp4', 'cpu')
        
        // Should NOT contain downloader args for HW accel
        expect(args.join(' ')).not.toContain('h264_nvenc')
        expect(args.join(' ')).not.toContain('h264_qsv')
    })

    it('should NOT use Video HW Accel for Audio-only downloads', async () => {
        const gpuSettings = createMockSettings({ hardwareDecoding: 'gpu' })
        // System has NVIDIA
        const args = await buildYtDlpArgs(url, { format: 'audio' }, gpuSettings, 'test.mp3', 'nvidia')
        
        // Should NOT invoke video encoder for mp3
        expect(args.join(' ')).not.toContain('h264_nvenc')
    })

    // -------------------------------------------------------------------------
    // 9. Comprehensive Audit Tests
    // -------------------------------------------------------------------------
    
    it('should ignore audioNormalization for GIF format (no audio)', async () => {
        const settings = createMockSettings({ audioNormalization: true })
        const options: YtDlpOptions = {
            format: 'gif',
            audioNormalization: true // User might have this on from a previous download
        }
        const args = await buildYtDlpArgs(url, options, settings, 'test.gif', 'cpu')
        
        // GIF has no audio, so loudnorm should NOT be applied
        expect(args.join(' ')).not.toContain('loudnorm')
    })
    
    it('should skip HW downloader args when forceTranscode + clipping are both active', async () => {
        const settings = createMockSettings({ hardwareDecoding: 'gpu' })
        const options: YtDlpOptions = {
            rangeStart: '10', // Clipping
            rangeEnd: '30',
            videoCodec: 'h264',
            forceTranscode: true // User wants a specific codec AND is clipping
        }
        const args = await buildYtDlpArgs(url, options, settings, 'test.mp4', 'nvidia')
        
        // HW downloader args should be SKIPPED to avoid conflict with VideoConvertor post-processor
        expect(args.join(' ')).not.toContain('--downloader-args')
        expect(args.join(' ')).not.toContain('h264_nvenc')
        
        // But VideoConvertor args SHOULD be present
        expect(args.join(' ')).toContain('VideoConvertor')
        expect(args.join(' ')).toContain('libx264')
    })
    
    it('should correctly handle AV1 codec with MP4 container', async () => {
        const settings = createMockSettings({ container: 'mp4' })
        const options: YtDlpOptions = {
            videoCodec: 'av1'
        }
        const args = await buildYtDlpArgs(url, options, settings, 'test.mp4', 'cpu')
        
        // Should include AV1 format string
        expect(args.join(' ')).toContain('vcodec^=av01')
        
        // Should include MP4 container
        expect(args).toContain('--merge-output-format')
        expect(args).toContain('mp4')
    })
    
    it('should correctly handle HEVC codec with MKV container', async () => {
        const settings = createMockSettings({ container: 'mkv' })
        const options: YtDlpOptions = {
            videoCodec: 'hevc'
        }
        const args = await buildYtDlpArgs(url, options, settings, 'test.mkv', 'cpu')
        
        // Should include HEVC format string
        expect(args.join(' ')).toContain('vcodec^=hevc')
        
        // Should include MKV container
        expect(args).toContain('--merge-output-format')
        expect(args).toContain('mkv')
    })
})
