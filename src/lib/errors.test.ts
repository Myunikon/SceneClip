/**
 * Unit Tests for errors.ts
 * Tests the error mapping and user-friendly error extraction functions
 */
import { describe, it, expect } from 'vitest'
import { getHumanReadableError, ytdlpErrorMap } from './errors'

describe('getHumanReadableError', () => {
    // Authentication / Login Issues
    describe('Authentication Errors', () => {
        it('should detect age-restricted video error', () => {
            const result = getHumanReadableError('ERROR: Sign in to confirm your age')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('Age-restricted')
        })

        it('should detect members-only content error', () => {
            const result = getHumanReadableError('This video is members-only content')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('Members-only')
        })

        it('should detect private video error', () => {
            const result = getHumanReadableError('ERROR: Private video. Sign in if you have access.')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('Private')
        })
    })

    // Cookie / Browser Access Issues
    describe('Cookie Access Errors', () => {
        it('should detect DPAPI error', () => {
            const result = getHumanReadableError('DPAPI decryption failed')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('browser cookies')
        })

        it('should detect database lock error', () => {
            const result = getHumanReadableError('database is locked')
            expect(result).not.toBeNull()
            expect(result?.action).toContain('Close your browser')
        })

        it('should detect missing profile error', () => {
            const result = getHumanReadableError('could not find a profile for browser')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('profile not found')
        })
    })

    // Video Availability Issues
    describe('Availability Errors', () => {
        it('should detect unavailable video', () => {
            const result = getHumanReadableError('Video unavailable')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('unavailable')
        })

        it('should detect premiere video', () => {
            const result = getHumanReadableError('Premieres in 2 hours')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('premiere')
        })

        it('should detect upcoming live stream', () => {
            const result = getHumanReadableError('This live event will begin in 30 minutes')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('Live stream')
        })

        it('should detect invalid URL', () => {
            const result = getHumanReadableError('is not a valid URL')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('Invalid URL')
        })

        it('should detect unsupported URL', () => {
            const result = getHumanReadableError('Unsupported URL: example.com')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('Unsupported')
        })
    })

    // HTTP Errors
    describe('HTTP Errors', () => {
        it('should detect 429 rate limit', () => {
            const result = getHumanReadableError('HTTP Error 429: Too Many Requests')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('rate limited')
        })

        it('should detect 403 forbidden', () => {
            const result = getHumanReadableError('HTTP Error 403: Forbidden')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('forbidden')
        })

        it('should detect 404 not found', () => {
            const result = getHumanReadableError('HTTP Error 404: Not Found')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('not found')
        })

        it('should detect 500 server error', () => {
            const result = getHumanReadableError('HTTP Error 500: Internal Server Error')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('Server error')
        })
    })

    // Network Issues
    describe('Network Errors', () => {
        it('should detect connection reset', () => {
            const result = getHumanReadableError('Connection reset by peer')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('reset')
        })

        it('should detect timeout', () => {
            const result = getHumanReadableError('Connection timed out')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('timed out')
        })
    })

    // Format / Extraction Issues
    describe('Extraction Errors', () => {
        it('should detect extraction failure', () => {
            const result = getHumanReadableError('Unable to extract video data')
            expect(result).not.toBeNull()
            expect(result?.action).toContain('yt-dlp updates')
        })

        it('should detect no formats', () => {
            const result = getHumanReadableError('No video formats found')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('formats')
        })

        it('should detect DRM protection', () => {
            const result = getHumanReadableError('This video is DRM protected')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('DRM')
        })
    })

    // Geo-restriction
    describe('Geo-restriction Errors', () => {
        it('should detect copyright block', () => {
            const result = getHumanReadableError('blocked on copyright grounds')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('copyright')
        })

        it('should detect country restriction', () => {
            const result = getHumanReadableError('not available in your country')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('Region-locked')
        })

        it('should detect geo restriction', () => {
            const result = getHumanReadableError('geo restriction applies')
            expect(result).not.toBeNull()
            expect(result?.action).toContain('VPN')
        })
    })

    // Fallback Behavior
    describe('Fallback Behavior', () => {
        it('should extract ERROR: message as fallback', () => {
            const result = getHumanReadableError('ERROR: Some unknown error occurred')
            expect(result).not.toBeNull()
            expect(result?.message).toContain('Some unknown error')
        })

        it('should return null for unrecognized errors', () => {
            const result = getHumanReadableError('Random text without error pattern')
            expect(result).toBeNull()
        })

        it('should be case insensitive', () => {
            const result = getHumanReadableError('VIDEO UNAVAILABLE')
            expect(result).not.toBeNull()
        })
    })
})

describe('ytdlpErrorMap', () => {
    it('should have message and action for all entries', () => {
        for (const info of Object.values(ytdlpErrorMap)) {
            expect(info.message).toBeDefined()
            expect(info.message.length).toBeGreaterThan(0)
            expect(info.action).toBeDefined()
            expect(info.action.length).toBeGreaterThan(0)
        }
    })

    it('should have at least 20 error patterns', () => {
        expect(Object.keys(ytdlpErrorMap).length).toBeGreaterThanOrEqual(20)
    })
})
