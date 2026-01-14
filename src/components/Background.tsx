

import { useAppStore } from '../store'

export function Background() {
  const { settings } = useAppStore()

  // Low Performance Mode: solid background, no animations
  if (settings.lowPerformanceMode) {
    return <div className="fixed inset-0 bg-background z-0" />
  }

  // Normal Mode: animated decorative blobs
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Light Mode Blobs (Pastel & Subtle) */}
      <div className="block dark:hidden" style={{ contentVisibility: 'auto', contain: 'paint' }}>
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-200/40 blur-[30px] animate-blob will-change-transform"></div>
         <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-100/60 blur-[30px] animate-blob animation-delay-2000 will-change-transform"></div>
         <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-200/30 blur-[30px] animate-blob animation-delay-4000 will-change-transform"></div>
      </div>

      {/* Dark Mode Blobs (Vibrant) */}
      <div className="hidden dark:block" style={{ contentVisibility: 'auto', contain: 'paint' }}>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[30px] animate-blob will-change-transform"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[30px] animate-blob animation-delay-2000 will-change-transform"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-600/20 blur-[30px] animate-blob animation-delay-4000 will-change-transform"></div>
      </div>
    </div>
  )
}
