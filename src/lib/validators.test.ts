/**
 * Unit Tests for validators.ts
 * Tests URL validation functions
 */
import { describe, it, expect } from 'vitest'
import { isValidVideoUrl, VIDEO_URL_REGEX, MAX_URL_LENGTH, matchDomain } from './validators'

describe('isValidVideoUrl', () => {
    it('should accept valid HTTP URLs', () => {
        expect(isValidVideoUrl('http://example.com/video')).toBe(true)
        expect(isValidVideoUrl('http://youtube.com/watch?v=abc123')).toBe(true)
    })

    it('should accept valid HTTPS URLs', () => {
        expect(isValidVideoUrl('https://youtube.com/watch?v=abc123')).toBe(true)
        expect(isValidVideoUrl('https://www.example.com/path/to/video')).toBe(true)
    })

    it('should reject empty or null input', () => {
        expect(isValidVideoUrl('')).toBe(false)
        expect(isValidVideoUrl('   ')).toBe(false)
    })

    it('should reject URLs without protocol', () => {
        expect(isValidVideoUrl('youtube.com/watch?v=abc')).toBe(false)
        expect(isValidVideoUrl('www.youtube.com')).toBe(false)
    })

    it('should reject non-HTTP protocols', () => {
        expect(isValidVideoUrl('ftp://example.com/file.mp4')).toBe(false)
        expect(isValidVideoUrl('file:///path/to/video.mp4')).toBe(false)
        expect(isValidVideoUrl('javascript:alert(1)')).toBe(false)
    })

    it('should reject URLs exceeding MAX_URL_LENGTH', () => {
        // Create a URL that is definitely longer than 2000 characters
        const longUrl = 'https://example.com/' + 'a'.repeat(MAX_URL_LENGTH + 1)
        expect(isValidVideoUrl(longUrl)).toBe(false)
    })

    it('should handle URLs with query parameters', () => {
        expect(isValidVideoUrl('https://youtube.com/watch?v=abc123&list=PLxyz')).toBe(true)
    })

    it('should handle URLs with special characters', () => {
        expect(isValidVideoUrl('https://example.com/video?title=hello%20world')).toBe(true)
    })
})

describe('VIDEO_URL_REGEX', () => {
    it('should match HTTP URLs', () => {
        expect(VIDEO_URL_REGEX.test('http://example.com')).toBe(true)
    })

    it('should match HTTPS URLs', () => {
        expect(VIDEO_URL_REGEX.test('https://example.com')).toBe(true)
    })

    it('should be case insensitive', () => {
        expect(VIDEO_URL_REGEX.test('HTTPS://EXAMPLE.COM')).toBe(true)
        expect(VIDEO_URL_REGEX.test('HTTP://example.com')).toBe(true)
    })
})

describe('matchDomain (Security Crosscheck)', () => {
    // 1. Identity & Normalization
    it('should match exact identity', () => {
        expect(matchDomain('https://google.com', 'google.com')).toBe(true)
        expect(matchDomain('https://WWW.GOOGLE.COM', 'google.com')).toBe(true)
        expect(matchDomain('https://google.com/path', 'GOOGLE.COM')).toBe(true)
    })

    // 2. Base Domain Scoping (Registered Domain)
    it('should match any subdomain if saved as registered domain', () => {
        expect(matchDomain('https://sub.google.com', 'google.com')).toBe(true)
        expect(matchDomain('https://very.deep.sub.google.com', 'google.com')).toBe(true)
        expect(matchDomain('https://m.youtube.com', 'youtube.com')).toBe(true)
    })

    // 3. Strict Subdomain Scoping (Sibling Isolation)
    it('should NOT match sibling subdomains if saved as a specific subdomain', () => {
        // saved: api.google.com
        expect(matchDomain('https://api.google.com', 'api.google.com')).toBe(true)
        expect(matchDomain('https://v1.api.google.com', 'api.google.com')).toBe(true) // Child matches

        expect(matchDomain('https://blog.google.com', 'api.google.com')).toBe(false) // Sibling fails
        expect(matchDomain('https://google.com', 'api.google.com')).toBe(false) // Parent fails
    })

    // 4. Public Suffix Protection
    it('should NEVER match a Public Suffix', () => {
        expect(matchDomain('https://google.com', 'com')).toBe(false)
        expect(matchDomain('https://site.co.uk', 'co.uk')).toBe(false)
        expect(matchDomain('https://my.github.io', 'github.io')).toBe(false)
    })

    // 5. Spoofing & Injection Protection
    it('should reject domain injection in path/query', () => {
        // malcious user tries to trigger crunchyroll creds on youtube
        expect(matchDomain('https://youtube.com/search?q=crunchyroll.com', 'crunchyroll.com')).toBe(false)
        expect(matchDomain('https://youtube.com/crunchyroll.com/video', 'crunchyroll.com')).toBe(false)
    })

    it('should reject similar but different domains (No partial matches)', () => {
        expect(matchDomain('https://not-google.com', 'google.com')).toBe(false)
        expect(matchDomain('https://google.com.malicious.com', 'google.com')).toBe(false)
    })

    // 6. Punycode/Homograph Protection (tldts handles this)
    it('should handle Punycode and Homographs safely', () => {
        // Real: google.com
        // Fake: googĺe.com (Latin Small Letter L With Acute)
        // tldts normalizes or treats them as distinct hostnames correctly.
        expect(matchDomain('https://xn--googe-79a.com', 'google.com')).toBe(false)
    })
})
