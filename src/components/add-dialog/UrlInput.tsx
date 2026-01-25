import { Clipboard, List, Link, X, Globe } from 'lucide-react'

import { cn } from '../../lib/utils'

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
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-primary" />
                    {t('dialog.url_label')}
                </label>
                {onBatchModeChange && (
                    <button
                        type="button"
                        onClick={() => onBatchModeChange(!batchMode)}
                        className={cn(
                            "text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all font-medium border",
                            batchMode
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground'
                        )}
                        title={batchMode ? t('url_input.single_switch') : t('url_input.switch_tooltip_batch')}
                    >
                        {batchMode ? <Link className="w-3 h-3" /> : <List className="w-3 h-3" />}
                        {batchMode ? t('url_input.single_switch') : t('url_input.batch_switch')}
                    </button>
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
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary">
                            <Link className="w-4 h-4" />
                        </div>
                        <input
                            required
                            type="url"
                            className="w-full h-10 pl-10 pr-10 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/30 text-[13px] font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/40"
                            placeholder={t('url_input.placeholder_single')}
                            value={url}
                            onChange={e => onChange(e.target.value)}
                            autoFocus
                        />
                        {url && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-black/20 hover:bg-black/30 text-white/50 hover:text-white transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                        {!url && (
                            <button
                                type="button"
                                onClick={onPaste}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                title={t('url_input.paste_clipboard')}
                            >
                                <Clipboard className="w-3.5 h-3.5" />
                            </button>
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
