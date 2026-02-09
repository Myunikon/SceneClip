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

        let unlistenDrop: (() => void) | undefined
        let unlistenHover: (() => void) | undefined
        let unlistenCancel: (() => void) | undefined

        const setupListeners = async () => {
            unlistenDrop = await listen('tauri://file-drop', (event) => {
                const payload = event.payload
                // Runtime validation to ensure payload is a string array
                if (Array.isArray(payload) && payload.every(p => typeof p === 'string') && payload.length > 0) {
                    onDrop(payload as string[])
                }
                setIsDragging(false)
            })

            unlistenHover = await listen('tauri://file-drop-hover', () => {
                setIsDragging(true)
            })

            unlistenCancel = await listen('tauri://file-drop-cancelled', () => {
                setIsDragging(false)
            })
        }

        setupListeners()

        // Handle window drag events for visual feedback (Web layer)
        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault()
            setIsDragging(true)
        }

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault()
            // Only clear if leaving window
            if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                setIsDragging(false)
            }
        }

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault() // Required to allow drop
        }

        window.addEventListener('dragenter', handleDragEnter as any)
        window.addEventListener('dragleave', handleDragLeave as any)
        window.addEventListener('dragover', handleDragOver as any)

        return () => {
            if (unlistenDrop) unlistenDrop()
            if (unlistenHover) unlistenHover()
            if (unlistenCancel) unlistenCancel()
            window.removeEventListener('dragenter', handleDragEnter as any)
            window.removeEventListener('dragleave', handleDragLeave as any)
            window.removeEventListener('dragover', handleDragOver as any)
        }
    }, [isOpen, onDrop])

    return { isDragging }
}
