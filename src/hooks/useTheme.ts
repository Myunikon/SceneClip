import { useEffect } from 'react'
import { AppSettings } from '../store/slices/types'

export function useTheme(themeSetting: { theme: AppSettings['theme'], frontendFontSize?: AppSettings['frontendFontSize'] }) {
    useEffect(() => {
        const root = window.document.documentElement

        const applyTheme = () => {
            // 1. Color Theme
            const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            const activeTheme = themeSetting.theme === 'system'
                ? (isSystemDark ? 'dark' : 'light')
                : themeSetting.theme

            root.classList.remove('light', 'dark')
            root.classList.add(activeTheme)

            // 2. Font Size
            // Remove previous font classes
            root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large')
            if (themeSetting.frontendFontSize) {
                root.classList.add(`font-size-${themeSetting.frontendFontSize}`)
                // Fallback inline style if classes not defined
                root.style.fontSize = themeSetting.frontendFontSize === 'small' ? '14px'
                    : themeSetting.frontendFontSize === 'large' ? '18px' : '16px'
            }
        }

        applyTheme()

        // Listen for system changes if in system mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => applyTheme()

        if (themeSetting.theme === 'system') {
            mediaQuery.addEventListener('change', handler)
        }

        // Cleanup: removeEventListener is safe to call even if not added
        return () => mediaQuery.removeEventListener('change', handler)
    }, [themeSetting.theme, themeSetting.frontendFontSize])
}
