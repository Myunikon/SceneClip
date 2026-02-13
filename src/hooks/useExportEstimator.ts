import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

interface EstimationParams {
    filePath?: string | null
    originalSizeStr?: string
    mediaType: 'video' | 'audio' | 'image'
    preset: string
    crf: number
    audioBitrate: string
}

/**
 * Query key for export size estimation
 */
export const exportEstimatorKeys = {
    all: ['exportEstimate'] as const,
    estimate: (params: EstimationParams) => [...exportEstimatorKeys.all, params] as const,
}

/**
 * Hook to estimate export size using TanStack Query.
 * Offloads heavy calculations and file probing to Rust.
 * 
 * ✨ TanStack Query benefits:
 * - Automatic race condition handling (no manual requestIdCounter needed)
 * - Built-in debounce via staleTime
 * - keepPreviousData for smooth UI during rapid changes
 * - Automatic caching and deduplication
 */
export function useExportEstimator({ filePath, originalSizeStr, mediaType, preset, crf, audioBitrate }: EstimationParams) {
    const { data: estimatedSize } = useQuery({
        queryKey: exportEstimatorKeys.estimate({ filePath, originalSizeStr, mediaType, preset, crf, audioBitrate }),
        queryFn: async () => {
            if (!originalSizeStr && !filePath) {
                return null
            }

            try {
                const bytes = await invoke<number>('estimate_export_size', {
                    params: {
                        file_path: filePath || null,
                        original_size_str: originalSizeStr || null,
                        media_type: mediaType,
                        preset,
                        crf,
                        audio_bitrate: audioBitrate
                    }
                })

                if (bytes === 0) {
                    return null
                }
                const mb = (bytes / (1024 * 1024)).toFixed(1)
                return `${mb} MB`
            } catch (error) {
                console.warn("[Estimator] Calculation skipped or failed:", error)
                return null
            }
        },
        staleTime: 500, // Acts as debounce - won't refetch for 500ms
        placeholderData: keepPreviousData, // Keep showing old value during updates
        retry: false, // Don't retry on failure
    })

    return estimatedSize ?? null
}
