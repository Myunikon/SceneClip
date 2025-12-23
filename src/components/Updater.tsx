import { Package, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../store'

export function Updater() {
    const { ytdlpVersion } = useAppStore()

    return (
        <div className="p-5 border border-border rounded-xl bg-card space-y-4">
             <div className="flex items-center gap-3">
                 <div className="bg-primary/10 p-2.5 rounded-lg">
                     <Package className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                     <h3 className="font-semibold text-base">Core Binaries</h3>
                     <p className="text-sm text-muted-foreground">Managed by Sidecar</p>
                 </div>
             </div>
             
             <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border/50">
                 <div className="flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     <span className="text-sm font-medium">Bundled (v{ytdlpVersion || 'Unknown'})</span>
                 </div>
                 <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border border-border/50">
                    Sidecar Mode
                 </span>
             </div>
        </div>
    )
}
