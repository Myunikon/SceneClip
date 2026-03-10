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

    // Portal Coordinates calculation with viewport boundary detection
    useLayoutEffect(() => {
        if (isOpen && containerRef.current) {
            const updateCoords = () => {
                const trigger = containerRef.current!
                const rect = trigger.getBoundingClientRect()

                // Estimate dropdown height (max 260px as per Select maxHeight)
                const dropdownMaxHeight = 260
                const gap = 4
                const viewportHeight = window.innerHeight

                // Check if dropdown fits below the trigger
                const spaceBelow = viewportHeight - rect.bottom - gap
                const spaceAbove = rect.top - gap

                let top: number
                if (spaceBelow >= dropdownMaxHeight || spaceBelow >= spaceAbove) {
                    // Place below (default)
                    top = rect.bottom + gap
                } else {
                    // Flip above: place dropdown end at trigger top
                    top = rect.top - gap - Math.min(dropdownMaxHeight, spaceAbove)
                }

                setCoords({
                    top,
                    left: align === 'left' ? rect.left : (rect.right - rect.width),
                    width: rect.width
                })
            }
            updateCoords()
            window.addEventListener('scroll', updateCoords, true)
            window.addEventListener('resize', updateCoords)

            return () => {
                window.removeEventListener('scroll', updateCoords, true)
                window.removeEventListener('resize', updateCoords)
            }
        } else {
            // Reset coords when closed so next open calculates fresh
            setCoords(null)
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
