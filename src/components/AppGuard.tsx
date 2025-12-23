import { useEffect, useState, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAppStore } from '../store'
import { CoolLoader } from './CoolLoader'

export function AppGuard({ children }: { children: React.ReactNode }) {
    const { 
        initListeners, 
        binariesReady
    } = useAppStore()
    
    const [loading, setLoading] = useState(true)
    const [initError, setInitError] = useState<string | null>(null)
    
    // Prevent double initialization race condition
    const initStartedRef = useRef(false)

    useEffect(() => {
         const init = async () => {
             if (initStartedRef.current) return
             initStartedRef.current = true
             
             setLoading(true)
             
             // Minimum loading time for smooth UX (1 second)
             const minLoad = new Promise(resolve => setTimeout(resolve, 1000))
             
             try {
                 await Promise.all([initListeners(), minLoad])
                 setLoading(false)
             } catch (e: any) {
                 console.error("AppGuard Init Error:", e)
                 setInitError(e.message || "Failed to initialize application")
                 setLoading(false)
             }
         }
         
         init()
    }, [])

    if (initError || (!loading && !binariesReady)) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground space-y-6 animate-in fade-in">
                <div className="bg-destructive/10 p-4 rounded-full">
                     <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
                <div className="text-center space-y-2 max-w-md px-6">
                    <h2 className="text-xl font-bold">Initialization Failed</h2>
                    <p className="text-muted-foreground text-sm">
                        {initError || "Core binaries (yt-dlp/ffmpeg) are missing or not executable."}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                        Please verify that the binaries are correctly placed in the application folder.
                    </p>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (loading) {
         return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
                <CoolLoader text="Initializing System..." />
            </div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}
