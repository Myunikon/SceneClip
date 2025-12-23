import { Clipboard } from 'lucide-react'
import { translations } from '../../lib/locales'

interface UrlInputProps {
    url: string
    onChange: (val: string) => void
    onPaste: () => void
    t: typeof translations['en']['dialog']
}

export function UrlInput({ url, onChange, onPaste, t }: UrlInputProps) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-muted-foreground tracking-wider">{t.url_label}</label>
            <div className="flex gap-2">
                <input
                    required
                    className="flex-1 p-3 rounded-xl border bg-secondary/20 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm shadow-sm"
                    placeholder="https://youtube.com/..."
                    value={url} 
                    onChange={e => onChange(e.target.value)}
                    autoFocus
                />
                <button 
                    type="button" 
                    onClick={onPaste}
                    className="px-4 border rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground hover:border-primary/50 group/paste"
                    title="Paste from Clipboard"
                >
                    <Clipboard className="w-5 h-5 group-hover/paste:stroke-primary transition-colors" />
                </button>
            </div>
        </div>
    )
}
