import { useMemo } from 'react'

interface EstimationParams {
    originalSizeStr?: string
    mediaType: 'video' | 'audio' | 'image'
    preset: string
    crf: number
    audioBitrate: string
}

const COMPRESSION_RATIOS: Record<string, number> = {
    // Audio Presets
    audio_wa: 0.3,
    audio_social: 0.7,
    audio_archive: 1.0,

    // Audio Bitrates
    '320k': 1.0,
    '128k': 0.7,
    '64k': 0.3,

    // Video CRF (Approximations)
    crf_high: 0.15, // >= 35
    crf_med: 0.3,   // >= 28
    crf_std: 0.6,   // >= 23
    crf_low: 0.95,  // >= 18
    crf_lossless: 1.1
}

export function useExportEstimator({ originalSizeStr, mediaType, preset, crf, audioBitrate }: EstimationParams) {

    const estimatedSize = useMemo(() => {
        if (!originalSizeStr) return null

        const sizeStr = originalSizeStr.toUpperCase()
        const isGB = sizeStr.includes('GIB') || sizeStr.includes('GB')
        const isMB = sizeStr.includes('MIB') || sizeStr.includes('MB')
        const isKB = sizeStr.includes('KIB') || sizeStr.includes('KB')

        let originalBytes = parseFloat(sizeStr)
        if (isNaN(originalBytes)) return null

        if (isGB) originalBytes *= 1024 * 1024 * 1024
        else if (isMB) originalBytes *= 1024 * 1024
        else if (isKB) originalBytes *= 1024

        let ratio = 1.0

        if (mediaType === 'audio') {
            if (preset === 'wa') ratio = COMPRESSION_RATIOS.audio_wa
            else if (preset === 'social') ratio = COMPRESSION_RATIOS.audio_social
            else if (preset === 'archive') ratio = COMPRESSION_RATIOS.audio_archive
            else {
                const bit = parseInt(audioBitrate)
                ratio = bit >= 320 ? 1.0 : bit >= 128 ? 0.7 : 0.4
            }
        } else {
            // Video Logic
            const activeCrf = crf
            if (activeCrf >= 35) ratio = COMPRESSION_RATIOS.crf_high
            else if (activeCrf >= 28) ratio = COMPRESSION_RATIOS.crf_med
            else if (activeCrf >= 23) ratio = COMPRESSION_RATIOS.crf_std
            else if (activeCrf >= 18) ratio = COMPRESSION_RATIOS.crf_low
            else ratio = COMPRESSION_RATIOS.crf_lossless
        }

        const estBytes = originalBytes * ratio
        const estMB = (estBytes / (1024 * 1024)).toFixed(1)
        return `${estMB} MB`

    }, [originalSizeStr, mediaType, preset, crf, audioBitrate])

    return estimatedSize
}
