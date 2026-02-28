import { Clipboard, List, Link, X, Globe, FolderOpen } from 'lucide-react'
import { TFunction } from 'i18next'

import { cn } from '../../../lib/utils'
import { notify } from '../../../lib/notify'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import { Button } from '../../ui/button'

interface UrlInputProps {
    url: string
    onChange: (val: string) => void
    onPaste: () => void
    t: TFunction
    batchMode?: boolean
    onBatchModeChange?: (batch: boolean) => void
}

export function UrlInput({ url, onChange, onPaste, t, batchMode = false, onBatchModeChange }: UrlInputProps) {

    const handleBatchImport = async () => {
        try {
            const { importBatchFile } = await import('../../../lib/batchImport')
            const result = await importBatchFile()

            if (result.urls.length > 0) {
                // If multiple URLs and we have the Switcher, enable batch mode
                if (result.urls.length > 1 && onBatchModeChange && !batchMode) {
                    onBatchModeChange(true)
                }

                const joined = result.urls.join('\n')
                onChange(joined)

                notify.success(t('dialog.batch_imported_title'), {
                    description: t('dialog.batch_imported_desc', { count: result.urls.length })
                })
            } else if (result.error) {
                notify.error(t('dialog.import_failed'), { description: result.error })
            }
        } catch (e) {
            console.error('Batch import failed', e)
            notify.error(t('dialog.import_failed'), {
                description: e instanceof Error ? e.message : 'Unknown error'
            })
        }
    }

    return (
        <div className="space-y-3 cq-p-2">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-[0.1em] flex items-center gap-1.5">
                    <Globe className="w-3 h-3 opacity-70" />
                    {t('dialog.url_label')}
                </label>

                {onBatchModeChange && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onBatchModeChange(!batchMode)}
                                    className={cn(
                                        "h-5 px-2 text-[10px] font-bold uppercase tracking-wider transition-colors gap-1.5",
                                        batchMode ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {batchMode ? <Link className="w-3 h-3" /> : <List className="w-3 h-3" />}
                                    <span>{batchMode ? t('url_input.single_switch') : t('url_input.batch_switch')}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{batchMode ? t('url_input.single_switch') : t('url_input.switch_tooltip_batch')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            <div className="relative group">
                {batchMode ? (
                    <div className="relative">
                        <textarea
                            required
                            className="w-full h-32 p-3 pl-3 rounded-xl bg-white dark:bg-black/20 border border-border/60 focus:bg-background focus:border-primary/40 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/30 resize-none font-mono leading-relaxed shadow-sm"
                            placeholder={t('url_input.placeholder_batch')}
                            value={url}
                            onChange={e => onChange(e.target.value)}
                            autoFocus
                        />
                        {/* Batch Import Button - Floating Bottom Right */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleBatchImport}
                                        className="absolute right-3 bottom-3 h-7 px-2 text-xs font-medium bg-background supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-sm border border-border/50 shadow-sm hover:text-primary gap-1.5"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        <span>{t('dialog.batch_import_btn') || 'Import'}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('dialog.batch_import_btn')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-colors group-focus-within:text-primary/60 pointer-events-none">
                            <Link className="w-4 h-4" />
                        </div>
                        <input
                            required
                            type="url"
                            className={cn(
                                "w-full h-10 pl-10 rounded-lg bg-white dark:bg-black/20 border border-border/60 focus:bg-background focus:border-primary/40 text-[13px] font-sans font-medium outline-none transition-all duration-300 placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/5 shadow-sm",
                                url ? "pr-20" : "pr-20" // Space for actions
                            )}
                            placeholder={t('url_input.placeholder_single')}
                            value={url}
                            onChange={e => onChange(e.target.value)}
                            autoFocus
                        />

                        {/* Right Actions: Clear | Paste | Import */}
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {url && (
                                <button
                                    type="button"
                                    onClick={() => onChange('')}
                                    className="h-7 w-7 rounded-md hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-all flex items-center justify-center mr-1"
                                    aria-label="Clear"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {!url && (
                                <>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={onPaste}
                                                    className="h-7 w-7 text-muted-foreground/70 hover:text-primary hover:bg-primary/10"
                                                >
                                                    <Clipboard className="w-3.5 h-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('url_input.paste_clipboard')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleBatchImport}
                                                    className="h-7 w-7 text-muted-foreground/70 hover:text-primary hover:bg-primary/10"
                                                >
                                                    <FolderOpen className="w-3.5 h-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('dialog.batch_import_btn')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {batchMode && (
                <p className="text-[10px] text-muted-foreground/60 px-1 italic">
                    {t('url_input.batch_desc')}
                </p>
            )}
        </div>
    )
}
