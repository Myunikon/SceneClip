import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { IS_MAC } from '../lib/platform'

interface ShortcutsHandlers {
    onNewTask: () => void
    onSettings: () => void
    onHistory: () => void
    onDownloads: () => void
}

export function useGlobalShortcuts({ onNewTask, onSettings, onHistory, onDownloads }: ShortcutsHandlers) {
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.defaultPrevented) return

            // Determine primary modifier (Cmd on Mac, Ctrl on Win/Linux)
            const mod = IS_MAC ? e.metaKey : e.ctrlKey

            // Open Add Dialog: Ctrl/Cmd + N
            if (mod && e.key.toLowerCase() === 'n') {
                e.preventDefault()
                onNewTask()
            }

            // Settings: Ctrl/Cmd + ,
            if (mod && e.key === ',') {
                e.preventDefault()
                onSettings()
            }

            // History: Ctrl + H (Win) vs Cmd + Shift + H (Mac)
            // Note: Cmd + H is macOS native "Hide Window", we must count it.
            // Using Shift helps avoid conflict.
            if (IS_MAC) {
                if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'h') {
                    e.preventDefault()
                    onHistory()
                }
            } else {
                if (e.ctrlKey && e.key.toLowerCase() === 'h') {
                    e.preventDefault()
                    onHistory()
                }
            }

            // Downloads (Home): Ctrl+J (Win) / Cmd+Opt+L (Mac)
            if (IS_MAC) {
                if (e.metaKey && e.altKey && e.key.toLowerCase() === 'l') {
                    e.preventDefault()
                    onDownloads()
                }
            } else {
                if (e.ctrlKey && e.key.toLowerCase() === 'j') {
                    e.preventDefault()
                    onDownloads()
                }
            }

            // Fullscreen: F11 or Cmd+Ctrl+F (Mac)
            const isF11 = e.key === 'F11'
            const isMacFullscreen = IS_MAC && e.metaKey && e.ctrlKey && e.key.toLowerCase() === 'f'

            if (isF11 || isMacFullscreen) {
                e.preventDefault() // prevent browser F11
                const win = getCurrentWindow()
                const isFull = await win.isFullscreen()
                await win.setFullscreen(!isFull)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onNewTask, onSettings, onHistory, onDownloads])
}
