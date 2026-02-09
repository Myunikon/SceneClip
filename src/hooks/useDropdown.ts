import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'

interface UseDropdownOptions {
    align?: 'left' | 'right'
}

export function useDropdown(options?: UseDropdownOptions) {
    const [isOpen, setIsOpen] = useState(false)
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)

    const align = options?.align || 'left'

    // Portal Coordinates calculation
    useLayoutEffect(() => {
        if (isOpen && containerRef.current) {
            const updateCoords = () => {
                const rect = containerRef.current!.getBoundingClientRect()
                setCoords({
                    top: rect.bottom + 4,
                    left: align === 'left' ? rect.left : (rect.right - rect.width),
                    width: rect.width
                })
            }
            updateCoords()
            // Optional: debounce this if needed for strict performance
            window.addEventListener('scroll', updateCoords, true)
            window.addEventListener('resize', updateCoords)

            return () => {
                window.removeEventListener('scroll', updateCoords, true)
                window.removeEventListener('resize', updateCoords)
            }
        }
    }, [isOpen, align])

    // External Click Handler to Close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                listRef.current &&
                !listRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                setFocusedIndex(-1)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            // Fix: Also close on window blur/focus loss if desired, but mousedown is standard.
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const toggle = useCallback(() => setIsOpen(prev => !prev), [])
    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => {
        setIsOpen(false)
        setFocusedIndex(-1)
    }, [])

    return {
        isOpen,
        toggle,
        open,
        close,
        containerRef,
        listRef,
        coords,
        focusedIndex,
        setFocusedIndex
    }
}
