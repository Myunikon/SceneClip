import { describe, it, expect } from 'vitest'
import { formatBytes, parseTime } from './utils'
import { estimateDownloadSize } from './mediaUtils'

describe('Utils', () => {
    it('formatBytes should format correctly', () => {
        expect(formatBytes(0)).toBe('0 Bytes')
        expect(formatBytes(1024)).toBe('1 KB')
        expect(formatBytes(1536)).toBe('1.5 KB')
        expect(formatBytes(1048576)).toBe('1 MB')
    })

    it('parseTime should handle various formats', () => {
        expect(parseTime('10')).toBe(10)
        expect(parseTime('01:10')).toBe(70)
        expect(parseTime('01:01:01')).toBe(3661)
        expect(parseTime('')).toBe(0)
    })
})

describe('MediaUtils', () => {
    it('estimateDownloadSize should calculate size based on duration ratio (clipping)', () => {
        const meta = { duration: 100, filesize_approx: 1000 }
        // 50% clip
        const options = { isClipping: true, rangeStart: '0', rangeEnd: '50', format: 'Best' }
        const size = estimateDownloadSize(meta, options)
        expect(size).toBe(500)
    })
})
