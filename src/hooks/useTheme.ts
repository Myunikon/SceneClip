import { useEffect } from 'react'
import { AppSettings } from '../store/slices/types'

export function useTheme(themeSetting: AppSettings['theme']) {
    useEffect(() => {
        const root = window.document.documentElement

        const applyTheme = () => {
            const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            const activeTheme = themeSetting === 'system'
                ? (isSystemDark ? 'dark' : 'light')
                : themeSetting

            root.classList.remove('light', 'dark')
            root.classList.add(activeTheme)
        }

        applyTheme()

        // Listen for system changes if in system mode
        if (themeSetting === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const handler = () => applyTheme()
            mediaQuery.addEventListener('change', handler)
            return () => mediaQuery.removeEventListener('change', handler)
        }
    }, [themeSetting])
}
