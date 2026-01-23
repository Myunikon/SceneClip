import { Scissors } from 'lucide-react'
import { RangeSlider } from '../RangeSlider'
import { cn, formatTime, parseTime } from '../../lib/utils'
import { SettingCard, OptionCard } from '../CommonSettings'
import { useAddDialogContext } from './AddDialogContext'

interface ClipSectionProps {
    maxDuration?: number // Still keeping this as an optional prop if needed for GIF specific override, or derive from options/context?
}

const TIME_INPUT_REGEX = /[^0-9:]/g

export function ClipSection({ maxDuration }: ClipSectionProps) {
    const { options, setters, meta, t } = useAddDialogContext()
    const duration = meta?.duration

    const { isClipping, rangeStart, rangeEnd, format } = options
    const { setIsClipping, setRangeStart, setRangeEnd } = setters

    // For GIF mode (when maxDuration is set), clipping is mandatory
    const isMandatory = !!maxDuration

    // Helper to validate and clamp times on blur
    const handleTimeBlur = (isStart: boolean) => {
        let s = parseTime(rangeStart)
        let e = parseTime(rangeEnd)

        // 1. Clamp to duration bounds
        if (duration) {
            s = Math.max(0, Math.min(s, duration))
            e = Math.max(0, Math.min(e, duration))
        } else {
            s = Math.max(0, s)
            e = Math.max(0, e)
        }

        // 2. Swap if inverted
        if (s >= e) {
            if (isStart) {
                // If we edited start and it went past end, push end to Match or valid range?
                // Logic: Swap them
                const temp = s
                s = e
                e = temp
            } else {
                // If we edited end and it went before start, swap
                const temp = s
                s = e
                e = temp
            }
        }

        // 3. Special case: If exactly same, maybe default to 10s gap? 
        // Existing logic was just swap. Let's keep it simple.

        setRangeStart(formatTime(s))
        setRangeEnd(formatTime(e))
    }

    return (
        <div className="space-y-3">
            {isMandatory ? (
                <OptionCard
                    icon={<Scissors className="w-4 h-4" />}
                    title={format === 'audio' ? (t.trim_audio || "Trim Audio") : t.trim_video}
                    description={t.trim_desc || "Cut specific portion of the video"}
                    activeColor="orange"
                    className="!bg-card dark:!bg-black/20 !border-border dark:!border-white/10"
                >
                    {renderClipContent()}
                </OptionCard>
            ) : (
                <SettingCard
                    icon={<Scissors className="w-4 h-4" />}
                    title={format === 'audio' ? (t.trim_audio || "Trim Audio") : t.trim_video}
                    description={t.trim_desc || "Cut specific portion of the video"}
                    checked={isClipping}
                    onCheckedChange={setIsClipping}
                    activeColor="orange"
                    expandableContent={renderClipContent()}
                    className="!bg-card dark:!bg-black/20 !border-border dark:!border-white/10"
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
                        {t.metadata_required}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex flex-1 items-center gap-1.5 p-0.5 rounded-lg border bg-white dark:bg-black/20 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20",
                        (rangeStart && rangeEnd && parseTime(rangeStart) >= parseTime(rangeEnd)) ? "border-red-500/50" : "border-border dark:border-white/10"
                    )}>
                        <input
                            className="w-full min-w-0 bg-transparent py-1.5 px-2 text-sm text-center font-mono outline-none placeholder:text-muted-foreground/30 focus:placeholder:text-muted-foreground/50 transition-colors"
                            placeholder="00:00"
                            value={rangeStart}
                            onChange={e => setRangeStart(e.target.value.replace(TIME_INPUT_REGEX, ''))}
                            onBlur={() => handleTimeBlur(true)}
                        />
                        <span className="text-muted-foreground/40 text-xs shrink-0">→</span>
                        <input
                            className="w-full min-w-0 bg-transparent py-1.5 px-2 text-sm text-center font-mono outline-none placeholder:text-muted-foreground/30 focus:placeholder:text-muted-foreground/50 transition-colors"
                            placeholder={duration ? formatTime(duration) : "00:10"}
                            value={rangeEnd}
                            onChange={e => setRangeEnd(e.target.value.replace(TIME_INPUT_REGEX, ''))}
                            onBlur={() => handleTimeBlur(false)}
                        />
                    </div>

                    {/* Duration Badge - Compact */}
                    <div className={cn(
                        "shrink-0 h-8 px-2.5 rounded-lg border flex items-center justify-center gap-1 font-mono text-xs font-medium shadow-sm transition-all",
                        maxDuration && rangeStart && rangeEnd && (parseTime(rangeEnd) - parseTime(rangeStart)) > maxDuration
                            ? "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400"
                            : (rangeStart && rangeEnd && parseTime(rangeEnd) > parseTime(rangeStart))
                                ? "bg-primary/10 border-primary/20 text-primary"
                                : "bg-muted/50 border-border dark:border-white/10 text-muted-foreground"
                    )}>
                        <span className="text-[10px] opacity-70">⏱</span>
                        <span>
                            {rangeStart && rangeEnd && parseTime(rangeEnd) > parseTime(rangeStart)
                                ? `${Math.round(parseTime(rangeEnd) - parseTime(rangeStart))}s`
                                : "--s"
                            }
                        </span>
                    </div>
                </div>

                {(rangeStart && rangeEnd && parseTime(rangeStart) >= parseTime(rangeEnd)) && (
                    <p className="text-xs text-red-500 font-bold mt-2 text-center animate-in slide-in-from-top-1">
                        {t.time_error}
                    </p>
                )}
                {maxDuration && rangeStart && rangeEnd && (parseTime(rangeEnd) - parseTime(rangeStart)) > maxDuration && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-2 text-center animate-in slide-in-from-top-1">
                        ⚠️ {t.gif_maker?.too_long?.replace('{max}', String(maxDuration)).replace('{current}', String(Math.round(parseTime(rangeEnd) - parseTime(rangeStart)))) || `Clip is too long! Max ${maxDuration}s for GIF. Current: ${Math.round(parseTime(rangeEnd) - parseTime(rangeStart))}s`}
                    </p>
                )}
            </div>
        )
    }
}
