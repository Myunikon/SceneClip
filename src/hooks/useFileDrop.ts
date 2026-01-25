import { useState, useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'

interface UseFileDropProps {
    isOpen: boolean
    onDrop: (files: string[]) => void
}

export function useFileDrop({ isOpen, onDrop }: UseFileDropProps) {
    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => {
        if (!isOpen) return

        let unlisten: (() => void) | undefined

        const setupListener = async () => {
            unlisten = await listen('tauri://file-drop', (event) => {
                const payload = event.payload as string[]
                if (payload && payload.length > 0) {
                    onDrop(payload)
                }
                setIsDragging(false)
            })
        }

        setupListener()

        // Handle window drag events for visual feedback
        const handleDragEnter = () => setIsDragging(true)
        const handleDragLeave = (e: MouseEvent) => {
            // Only clear if leaving window or strictly leaving the overlay logic if we implemented a specific overlay
            // Ideally we check if relatedTarget is null (meaning left the window)
            if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                setIsDragging(false)
            }
        }

        // We also need to listen to 'tauri://file-drop-cancelled' inside Tauri usually, 
        // but for web events:
        window.addEventListener('dragenter', handleDragEnter)
        window.addEventListener('dragleave', handleDragLeave)
        // Also listen to 'drop' on window to prevent default browser behavior if needed, 
        // though Tauri usually handles the file-drop event separatel.

        return () => {
            if (unlisten) unlisten()
            window.removeEventListener('dragenter', handleDragEnter)
            window.removeEventListener('dragleave', handleDragLeave)
        }
    }, [isOpen, onDrop])

    return { isDragging }
}
