import { Clipboard, List, Link, X, Globe, FolderOpen } from 'lucide-react'

import { cn } from '../../../lib/utils'
import { notify } from '../../../lib/notify'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import { Button } from '../../ui/button'

interface UrlInputProps {
    url: string
    onChange: (val: string) => void
    onPaste: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any
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
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-primary" />
                    {t('dialog.url_label')}
                </label>
                {onBatchModeChange && (
                    <TooltipProvider>
                        <Tooltip side="left">
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    onClick={() => onBatchModeChange(!batchMode)}
                                    className={cn(
                                        "h-auto w-auto text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all font-medium border",
                                        batchMode
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                                            : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                                    )}
                                >
                                    {batchMode ? <Link className="w-3 h-3" /> : <List className="w-3 h-3" />}
                                    {batchMode ? t('url_input.single_switch') : t('url_input.batch_switch')}
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
                            className="w-full h-32 p-3 pl-10 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/30 text-[13px] font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/40 resize-none font-mono leading-relaxed"
                            placeholder={t('url_input.placeholder_batch')}
                            value={url}
                            onChange={e => onChange(e.target.value)}
                            autoFocus
                        />
                        <div className="absolute left-3 top-3 text-muted-foreground/50">
                            <List className="w-4 h-4" />
                        </div>
                        {/* Batch Import Button inside Textarea (Floating bottom-right) */}
                        <TooltipProvider>
                            <Tooltip side="left">
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        onClick={handleBatchImport}
                                        className="h-auto w-auto absolute right-3 bottom-3 p-1.5 rounded-md bg-background/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border border-border/50 shadow-sm backdrop-blur-sm"
                                    >
                                        <FolderOpen className="w-4 h-4" />
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
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary">
                            <Link className="w-4 h-4" />
                        </div>
                        <input
                            required
                            type="url"
                            className="w-full h-12 pl-12 pr-20 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/50 text-[14px] font-medium 
                            outline-none transition-all duration-200 placeholder:text-muted-foreground/40
                            focus:ring-2 focus:ring-primary/10 focus:shadow-[0_0_0_4px_rgba(var(--primary),0.05)]"
                            placeholder={t('url_input.placeholder_single')}
                            value={url}
                            onChange={e => onChange(e.target.value)}
                            autoFocus
                        />
                        {url && (
                            <Button
                                type="button"
                                onClick={() => onChange('')}
                                className="h-auto w-auto absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-black/20 hover:bg-black/30 text-white/50 hover:text-white transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                        {!url && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <TooltipProvider>
                                    <Tooltip side="top">
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                type="button"
                                                onClick={handleBatchImport}
                                                className="h-auto w-auto p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                            >
                                                <FolderOpen className="w-3.5 h-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('dialog.batch_import_btn')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <div className="w-px h-3 bg-border/50" />
                                <TooltipProvider>
                                    <Tooltip side="top">
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                type="button"
                                                onClick={onPaste}
                                                className="h-auto w-auto p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                            >
                                                <Clipboard className="w-3.5 h-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('url_input.paste_clipboard')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {batchMode && (
                <p className="text-xs text-muted-foreground/70 pl-1">
                    {t('url_input.batch_desc')}
                </p>
            )}
        </div>
    )
}
