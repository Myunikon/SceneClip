

import { useAppStore } from '../store'

export function Background() {
  const { settings } = useAppStore()

  // Low Performance Mode: solid background, no animations
  if (settings.lowPerformanceMode) {
    return <div className="fixed inset-0 bg-background -z-10" />
  }

  // Normal Mode: animated decorative blobs
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/30 dark:bg-purple-600/20 blur-[60px] animate-blob mix-blend-multiply dark:mix-blend-normal"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/30 dark:bg-blue-600/20 blur-[60px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-normal"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-500/30 dark:bg-pink-600/20 blur-[60px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-normal"></div>
    </div>
  )
}
