import { TFunction } from 'i18next'

/**
 * Format ETA (seconds) into human-readable localized string.
 * 
 * @example
 * formatEtaHumanReadable(3665, t) // "1 hour, 1 minute and 5 seconds remaining"
 * formatEtaHumanReadable(120, t)  // "2 minutes remaining"
 * 
 * @see Context7: i18next uses `{count: N}` with `key_one`/`key_other` suffixes
 */
export function formatEtaHumanReadable(seconds: number, t: TFunction): string {
    // Handle invalid values
    if (seconds < 0 || isNaN(seconds) || !isFinite(seconds)) {
        return t('eta.unknown')
    }

    // Round to whole seconds
    const totalSecs = Math.floor(seconds)

    const hours = Math.floor(totalSecs / 3600)
    const minutes = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60

    const parts: string[] = []

    // i18next v21+ uses _one/_other suffix for plural forms
    // e.g., t('eta.hours', {count: 2}) resolves to "2 hours"
    if (hours > 0) {
        parts.push(t('eta.hours', { count: hours }))
    }
    if (minutes > 0) {
        parts.push(t('eta.minutes', { count: minutes }))
    }
    if (secs > 0 || parts.length === 0) {
        parts.push(t('eta.seconds', { count: secs }))
    }

    // Join with localized conjunction
    // e.g., "1 hour, 2 minutes and 30 seconds"
    const andWord = t('eta.and')
    const joined = parts.length > 1
        ? parts.slice(0, -1).join(', ') + (andWord ? ` ${andWord} ` : ' ') + parts[parts.length - 1]
        : parts[0]

    return t('eta.remaining', { time: joined })
}

export function formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec <= 0 || isNaN(bytesPerSec) || !isFinite(bytesPerSec)) {
        return '0 B/s'
    }

    const units = ['B/s', 'KiB/s', 'MiB/s', 'GiB/s']
    let value = bytesPerSec
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex++
    }

    // No decimals for bytes, 2 decimals for larger units
    const decimals = unitIndex === 0 ? 0 : 2
    return `${value.toFixed(decimals)} ${units[unitIndex]}`
}

/**
 * Format byte count into human-readable size string.
 * Auto-scales from B → KiB → MiB → GiB → TiB
 * 
 * @example
 * formatBytes(1536000)  // "1.46 MiB"
 * formatBytes(1024)     // "1.00 KiB"
 */
export function formatBytes(bytes: number): string {
    if (bytes <= 0 || isNaN(bytes) || !isFinite(bytes)) {
        return '0 B'
    }

    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
    let value = bytes
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex++
    }

    const decimals = unitIndex === 0 ? 0 : 2
    return `${value.toFixed(decimals)} ${units[unitIndex]}`
}

/**
 * Format raw ETA seconds into simple compact string (fallback, no i18n).
 * 
 * @example
 * formatEtaCompact(3665)  // "1:01:05"
 * formatEtaCompact(125)   // "2:05"
 */
export function formatEtaCompact(seconds: number): string {
    if (seconds < 0 || isNaN(seconds) || !isFinite(seconds)) {
        return '-'
    }

    const totalSecs = Math.floor(seconds)
    const hours = Math.floor(totalSecs / 3600)
    const minutes = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`
}
