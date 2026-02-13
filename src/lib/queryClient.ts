import { QueryClient } from '@tanstack/react-query'

/**
 * Global QueryClient instance for TanStack Query.
 * Configured for Tauri desktop app:
 * - Disabled refetchOnWindowFocus (desktop apps don't need this)
 * - Moderate staleTime to reduce unnecessary refetches
 * - Retry twice on failure
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // 1 minute - data considered fresh
            gcTime: 1000 * 60 * 5, // 5 minutes - cache garbage collection
            retry: 2,
            refetchOnWindowFocus: false, // Desktop app doesn't need this
            refetchOnReconnect: true,
        },
        mutations: {
            retry: 1,
        },
    },
})
