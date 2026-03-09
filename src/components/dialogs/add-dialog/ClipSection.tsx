import { Scissors } from 'lucide-react'
import { RangeSlider } from '../../ui'
import { cn, formatTime, parseTime } from '../../../lib/utils'
import { SettingCard, OptionCard } from '../../common'
import { useAddDialogContext } from './AddDialogContext'
import { useEffect } from 'react'

interface ClipSectionProps {
    maxDuration?: number
}

const TIME_INPUT_REGEX = /[^0-9:]/g

export function ClipSection({ maxDuration }: ClipSectionProps) {
    const { options, setters, meta, t } = useAddDialogContext()
    const duration = meta?.duration

    const { isClipping, rangeStart, rangeEnd, format } = options
    const { setIsClipping, setRangeStart, setRangeEnd } = setters

    // For GIF mode (when maxDuration is set), clipping is mandatory
    const isMandatory = !!maxDuration

    // FIX #1 & #5: Auto-fill default time range when clip is activated and fields are empty
    useEffect(() => {
        if (isClipping && duration && !rangeStart && !rangeEnd) {
            setRangeStart(formatTime(0))
            // For GIF, cap at maxDuration; otherwise use full duration
            const defaultEnd = maxDuration ? Math.min(duration, maxDuration) : duration
            setRangeEnd(formatTime(defaultEnd))
        }
    }, [isClipping, duration, rangeStart, rangeEnd, maxDuration, setRangeStart, setRangeEnd])

    // Automatic memoization by React Compiler
    const parsedStart = parseTime(rangeStart)
    const parsedEnd = parseTime(rangeEnd)
    const isInvalidRange = !!(rangeStart && rangeEnd && parsedStart >= parsedEnd)
    const clipDuration = parsedEnd - parsedStart

    // Helper to validate and clamp times on blur
    const handleTimeBlur = () => {
        let s = parsedStart
        let e = parsedEnd

        // 1. Clamp to duration bounds
        if (duration) {
            s = Math.max(0, Math.min(s, duration))
            e = Math.max(0, Math.min(e, duration))
        } else {
            s = Math.max(0, s)
            e = Math.max(0, e)
        }

        // 2. Swap if inverted
        if (s > e) {
            [s, e] = [e, s]
        }

        // 3. Ensure minimum duration (1s)
        if (e - s < 1) {
            if (duration && e >= duration) {
                s = Math.max(0, e - 1)
            } else {
                e = s + 1
            }
        }

        setRangeStart(formatTime(s))
        setRangeEnd(formatTime(e))
    }

    return (
        <div className="space-y-3">
            {isMandatory ? (
                <OptionCard
                    icon={<Scissors className="w-4 h-4" />}
                    title={format === 'audio' ? (t('dialog.trim_audio') || "Trim Audio") : t('dialog.trim_video')}
                    description={t('dialog.trim_desc') || "Cut specific portion of the video"}
                    activeColor="orange"
                    className="!bg-card dark:!bg-black/20 !border-border/60 dark:!border-white/10 !cursor-default"
                >
                    {renderClipContent()}
                </OptionCard>
            ) : (
                <SettingCard
                    icon={<Scissors className="w-4 h-4" />}
                    title={format === 'audio' ? (t('dialog.trim_audio') || "Trim Audio") : t('dialog.trim_video')}
                    description={t('dialog.trim_desc') || "Cut specific portion of the video"}
                    checked={isClipping}
                    onCheckedChange={setIsClipping}
                    activeColor="orange"
                    expandableContent={renderClipContent()}
                    className="!bg-card dark:!bg-black/20 !border-border/60 dark:!border-white/10"
                />
            )}
        </div>
    )

    function renderClipContent() {
        return (
            <div className="pt-4 pb-2 px-1 space-y-3">
                {duration ? (
                    <div className="mx-2">
                        <RangeSlider
                            duration={duration}
                            start={rangeStart ? parseTime(rangeStart) : 0}
                            end={rangeEnd ? parseTime(rangeEnd) : duration}
                            onChange={(s, e) => {
                                setRangeStart(formatTime(s))
                                setRangeEnd(formatTime(e))
                            }}
                        />
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground text-center py-1.5 bg-muted/50 dark:bg-secondary/20 rounded-lg border border-border/50">
                        {t('dialog.metadata_required')}
                    </div>
                )}

                {/* FIX #4: Added "From" / "To" labels for clarity */}
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex flex-1 items-center gap-0 p-0.5 rounded-lg border bg-white dark:bg-black/20 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20",
                        isInvalidRange ? "border-red-500/50" : "border-border/60 dark:border-white/10"
                    )}>
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <span className="text-[10px] text-muted-foreground/50 leading-none pt-1">
                                {t('dialog.from') || "From"}
                            </span>
                            <input
                                className="w-full min-w-0 bg-transparent py-1 px-2 text-sm text-center font-mono outline-none placeholder:text-muted-foreground/30 focus:placeholder:text-muted-foreground/50 transition-colors"
                                placeholder="00:00"
                                value={rangeStart}
                                onChange={e => setRangeStart(e.target.value.replace(TIME_INPUT_REGEX, ''))}
                                onBlur={handleTimeBlur}
                            />
                        </div>
                        <span className="text-muted-foreground/40 text-xs shrink-0 px-1">→</span>
                        <div className="flex-1 flex flex-col items-center min-w-0">
                            <span className="text-[10px] text-muted-foreground/50 leading-none pt-1">
                                {t('dialog.to') || "To"}
                            </span>
                            <input
                                className="w-full min-w-0 bg-transparent py-1 px-2 text-sm text-center font-mono outline-none placeholder:text-muted-foreground/30 focus:placeholder:text-muted-foreground/50 transition-colors"
                                placeholder={duration ? formatTime(duration) : "00:10"}
                                value={rangeEnd}
                                onChange={e => setRangeEnd(e.target.value.replace(TIME_INPUT_REGEX, ''))}
                                onBlur={handleTimeBlur}
                            />
                        </div>
                    </div>
                </div>

                {/* FIX #4 (Apple HIG): Duration as contextual inline text, not a separate badge */}
                <div className="text-center">
                    <span className={cn(
                        "text-xs font-mono transition-colors",
                        maxDuration && rangeStart && rangeEnd && clipDuration > maxDuration
                            ? "text-orange-500"
                            : (rangeStart && rangeEnd && clipDuration > 0)
                                ? "text-primary/80"
                                : "text-muted-foreground/40"
                    )}>
                        {rangeStart && rangeEnd && clipDuration > 0
                            ? `${t('dialog.clip_duration') || 'Duration'}: ${Math.round(clipDuration)}s`
                            : duration
                                ? `${t('dialog.clip_duration') || 'Duration'}: ${Math.round(duration)}s`
                                : ""
                        }
                    </span>
                </div>

                {isInvalidRange && (
                    <p className="text-xs text-red-500 font-bold mt-2 text-center animate-in slide-in-from-top-1">
                        {t('dialog.time_error')}
                    </p>
                )}
                {maxDuration && rangeStart && rangeEnd && clipDuration > maxDuration && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-2 text-center animate-in slide-in-from-top-1">
                        ⚠️ {t('dialog.gif_maker.too_long', { max: maxDuration, current: Math.round(clipDuration) }) || `Clip is too long! Max ${maxDuration}s for GIF. Current: ${Math.round(clipDuration)}s`}
                    </p>
                )}
            </div>
        )
    }
}
