import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface ShortcutsHandlers {
    onNewTask: () => void
    onSettings: () => void
    onHistory: () => void
    onDownloads: () => void
}

export function useGlobalShortcuts({ onNewTask, onSettings, onHistory, onDownloads }: ShortcutsHandlers) {
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'q') return // Let toggle sidebar work (if exists)

            // Open Add Dialog
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault()
                onNewTask()
            }

            // Settings
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault()
                onSettings()
            }

            // History
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault()
                onHistory()
            }

            // Downloads (Home)
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault()
                onDownloads()
            }

            // F11 Fullscreen
            if (e.key === 'F11') {
                e.preventDefault()
                const win = getCurrentWindow()
                const isFull = await win.isFullscreen()
                await win.setFullscreen(!isFull)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onNewTask, onSettings, onHistory, onDownloads])
}
