/**
 * Unit Tests for updater-service.ts
 * Tests version comparison logic
 */
import { describe, it, expect } from 'vitest'
import { compareVersions } from './updater-service'

describe('compareVersions', () => {
    describe('Equal versions', () => {
        it('should return 0 for identical versions', () => {
            expect(compareVersions('2024.12.23', '2024.12.23')).toBe(0)
        })

        it('should return 0 for equivalent versions with different formats', () => {
            expect(compareVersions('20241223', '20241223')).toBe(0)
        })
    })

    describe('Older vs Newer', () => {
        it('should return -1 when current is older than latest', () => {
            expect(compareVersions('2024.10.01', '2024.12.23')).toBe(-1)
        })

        it('should return 1 when current is newer than latest', () => {
            expect(compareVersions('2024.12.23', '2024.10.01')).toBe(1)
        })

        it('should compare year correctly', () => {
            expect(compareVersions('2023.12.31', '2024.01.01')).toBe(-1)
        })

        it('should compare month correctly', () => {
            expect(compareVersions('2024.01.01', '2024.12.01')).toBe(-1)
        })

        it('should compare day correctly', () => {
            expect(compareVersions('2024.12.01', '2024.12.31')).toBe(-1)
        })
    })

    describe('Null handling', () => {
        it('should return 0 when current is null', () => {
            expect(compareVersions(null, '2024.12.23')).toBe(0)
        })

        it('should return 0 when latest is null', () => {
            expect(compareVersions('2024.12.23', null)).toBe(0)
        })

        it('should return 0 when both are null', () => {
            expect(compareVersions(null, null)).toBe(0)
        })
    })

    describe('Different version formats', () => {
        it('should handle FFmpeg-style versions', () => {
            // FFmpeg uses formats like "autobuild-2024-12-23-14-21"
            // The function strips non-numeric chars
            const result = compareVersions('7.1', '7.2')
            expect(result).toBe(-1)
        })

        it('should handle yt-dlp date versions', () => {
            expect(compareVersions('2024.10.10', '2024.11.11')).toBe(-1)
        })

        it('should strip non-numeric characters', () => {
            // "v2024.12.23" should be normalized to "20241223"
            expect(compareVersions('v2024.12.01', 'v2024.12.31')).toBe(-1)
        })
    })
})
