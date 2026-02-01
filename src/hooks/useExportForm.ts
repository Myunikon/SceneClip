import { useState, useEffect } from 'react'

export type PresetKey = 'wa' | 'social' | 'archive' | 'custom'
export type EncoderType = 'auto' | 'cpu' | 'nvenc' | 'amf' | 'qsv'

export interface CompressionOptions {
    preset: PresetKey
    crf: number
    resolution: string
    encoder: EncoderType
    speedPreset: string
    audioBitrate: string
}

interface PresetConfig {
    crf?: number
    resolution?: string
    speedPreset?: string
    audioBitrate?: string
}

// Presets Config
const PRESETS: Record<Exclude<PresetKey, 'custom'>, PresetConfig> = {
    wa: { crf: 28, resolution: '720', speedPreset: 'veryfast', audioBitrate: '64k' },
    social: { crf: 23, resolution: '1080', speedPreset: 'medium', audioBitrate: '128k' },
    archive: { crf: 18, resolution: 'original', speedPreset: 'slow', audioBitrate: '320k' }
}

export function useExportForm(mediaType: 'video' | 'audio' | 'image') {
    const [preset, setPreset] = useState<PresetKey>('social')
    const [isAdvanced, setIsAdvanced] = useState(false)

    // Form State
    const [crf, setCrf] = useState(23)
    const [resolution, setResolution] = useState('1080')
    const [encoder, setEncoder] = useState<EncoderType>('auto')
    const [speedPreset, setSpeedPreset] = useState('medium')
    const [audioBitrate, setAudioBitrate] = useState('128k')

    // Apply Presets when changed (only if not in custom mode implicitly via manual edits, 
    // but here we want explicit preset selection to override manual settings)
    useEffect(() => {
        if (preset === 'custom') return

        const p = PRESETS[preset]
        if (p) {
            if (mediaType === 'audio') {
                if (p.audioBitrate) setAudioBitrate(p.audioBitrate)
            } else {
                if (p.crf !== undefined) setCrf(p.crf)
                if (p.resolution) setResolution(p.resolution)
                if (p.speedPreset) setSpeedPreset(p.speedPreset)
            }
        }
    }, [preset, mediaType])

    // Helper to set manual values and auto-switch to custom
    const updateManual = (key: keyof CompressionOptions, value: any) => {
        setPreset('custom')
        if (key === 'crf') setCrf(value)
        if (key === 'resolution') setResolution(value)
        if (key === 'speedPreset') setSpeedPreset(value)
        if (key === 'audioBitrate') setAudioBitrate(value)
        if (key === 'encoder') setEncoder(value)
    }

    return {
        // State
        preset,
        isAdvanced,
        crf,
        resolution,
        encoder,
        speedPreset,
        audioBitrate,

        // Setters
        setPreset,
        setIsAdvanced,
        setCrf: (v: number) => updateManual('crf', v),
        setResolution: (v: string) => updateManual('resolution', v),
        setSpeedPreset: (v: string) => updateManual('speedPreset', v),
        setAudioBitrate: (v: string) => updateManual('audioBitrate', v),
        setEncoder: (v: EncoderType) => updateManual('encoder', v),

        // raw setters if needed (e.g. for simple toggles not affecting preset)
        toggleAdvanced: () => setIsAdvanced(prev => !prev)
    }
}
