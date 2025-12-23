import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { translations } from '../lib/locales'
import { useAppStore } from '../store'
import { cn } from '../lib/utils'
import { Select } from './Select'

interface SelectDownloadTypeProps {
    format: string
    setFormat: (fmt: string) => void
    container: string
    setContainer: (fmt: string) => void
    availableResolutions?: number[]
}

export function SelectDownloadType({ format, setFormat, container, setContainer, availableResolutions }: SelectDownloadTypeProps) {
    const { settings } = useAppStore()
    const t = translations[settings.language].dialog

    const [mode, setMode] = useState<'video' | 'audio'>('video')
    
    // Sync mode with current format on mount/update
    useEffect(() => {
        if (format === 'audio') setMode('audio')
        else setMode('video')
    }, []) // Only on mount to avoid loops, or handle smarter? 
    
    const handleTabChange = (m: 'video' | 'audio') => {
        setMode(m)
        if (m === 'audio') {
            setFormat('audio') // Default audio approach
        } else {
            if (format === 'audio') setFormat('Best') // Reset to video default
        }
    }

    // Generate formats dynamically if available, otherwise fallback to static standard list
    const videoFormats = (availableResolutions && availableResolutions.length > 0)
        ? [
            { value: 'Best', label: t.formats.best },
            ...availableResolutions.map(h => {
                let label = `${h}p`
                if (h === 2160) label = '4K (2160p)'
                else if (h === 1440) label = '2K (1440p)'
                else if (h === 1080) label = '1080p'
                else if (h === 720) label = '720p'
                else if (h === 480) label = '480p'
                else if (h === 360) label = '360p'
                return { value: String(h), label }
            })
        ]
        : [
            { value: 'Best', label: t.formats.best },
            { value: '2160', label: '4K (2160p)' },
            { value: '1440', label: '2K (1440p)' },
            { value: '1080', label: '1080p' },
            { value: '720', label: '720p' },
            { value: '480', label: '480p' },
            { value: '360', label: '360p' },
        ]



    return (
        <div className="space-y-4">
            {/* Type Switcher (Tabs) */}
            <div className="flex p-1 bg-secondary/30 rounded-xl">
                <button 
                    type="button"
                    onClick={() => handleTabChange('video')}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all", mode === 'video' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                    Video
                </button>
                <button 
                    type="button"
                    onClick={() => handleTabChange('audio')}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all", mode === 'audio' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                    Audio
                </button>
            </div>

            {/* Format Selection */}
            {mode === 'video' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">{t.format_label}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {videoFormats.map(fmt => {
                            // Filter Logic - Handled by dynamic list generation above
                            // if (availableResolutions ...) logic removed
                            
                            return (
                                <button
                                    key={fmt.value}
                                    type="button"
                                    onClick={() => setFormat(fmt.value)}
                                    className={cn(
                                        "p-2 text-xs border rounded-lg transition-all font-medium",
                                        format === fmt.value 
                                        ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10' 
                                        : 'bg-background border-border hover:bg-secondary/50 text-muted-foreground'
                                    )}
                                >
                                    {fmt.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {mode === 'audio' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-full text-primary">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">Audio Only</p>
                            <p className="text-xs text-muted-foreground">Best available quality, converted to MP3</p>
                        </div>
                    </div>
                </div>
            )}


            {/* Container & Turbo Options */}
             <div className="pt-2">
                <div className={cn("space-y-2 transition-opacity", mode === 'audio' ? 'opacity-50 pointer-events-none grayscale' : '')}>
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Container</label>
                    <Select 
                        value={container}
                        onChange={setContainer}
                        options={[
                            { value: 'mp4', label: 'MP4 (Standard)' },
                            { value: 'mkv', label: 'MKV (Robust)' }
                        ]}
                        disabled={mode === 'audio'}
                    />
                </div>
            </div>
        </div>
    )
}
