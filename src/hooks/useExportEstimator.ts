import { useState, useEffect, useRef } from 'react'
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
 * Hook to estimate export size.
 * Offloads heavy calculations and file probing to Rust.
 * Handles race conditions using a sequence ID.
 */
export function useExportEstimator({ filePath, originalSizeStr, mediaType, preset, crf, audioBitrate }: EstimationParams) {
    const [estimatedSize, setEstimatedSize] = useState<string | null>(null)
    const requestIdCounter = useRef(0)

    useEffect(() => {
        const id = ++requestIdCounter.current

        // Debounce estimation to prevent backend spam when sliders are moved rapidly
        const timeoutId = setTimeout(() => {
            const runEstimation = async () => {
                if (!originalSizeStr && !filePath) {
                    setEstimatedSize(null)
                    return
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

                    // Only update if this is still the most recent request
                    if (id === requestIdCounter.current) {
                        if (bytes === 0) {
                            setEstimatedSize(null)
                        } else {
                            const mb = (bytes / (1024 * 1024)).toFixed(1)
                            setEstimatedSize(`${mb} MB`)
                        }
                    }
                } catch (error) {
                    console.warn("[Estimator] Calculation skipped or failed:", error)
                }
            }

            runEstimation()
        }, 500) // 500ms debounce

        return () => clearTimeout(timeoutId)
    }, [filePath, originalSizeStr, mediaType, preset, crf, audioBitrate])

    return estimatedSize
}


