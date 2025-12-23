import { Download } from 'lucide-react'

interface DownloadEmptyStateProps {
    t: any
}

export function DownloadEmptyState({ t }: DownloadEmptyStateProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4 max-w-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-background shadow-inner">
                    <Download className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">{t.empty}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Ready to download? Click the <strong className="text-primary">(+)</strong> button above or paste a link from YouTube, TikTok, or Instagram.
                </p>
                <div className="pt-4 flex justify-center gap-2">
                    <div className="px-3 py-1 bg-secondary rounded-md text-[10px] font-mono text-muted-foreground group relative cursor-help">
                        <span className="group-hover:hidden">Ctrl / Cmd + N</span>
                        <span className="hidden group-hover:block transition-all text-primary font-bold">New Download</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
