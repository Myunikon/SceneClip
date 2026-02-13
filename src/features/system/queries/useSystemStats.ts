import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'

/**
 * System statistics returned from Rust backend
 */
export interface DiskInfo {
    name: string
    mount_point: string
    total_space: number
    available_space: number
}

export interface SystemStats {
    cpu_usage: number
    memory_used: number
    memory_total: number
    memory_percent: number
    download_speed: number
    upload_speed: number
    disk_free: number
    disk_total: number
    disks: DiskInfo[]
}

/**
 * Query key for system stats - used for cache invalidation
 */
export const systemStatsKeys = {
    all: ['systemStats'] as const,
    byPath: (downloadPath: string) => [...systemStatsKeys.all, downloadPath] as const,
}

/**
 * Hook to fetch system stats from Rust backend using TanStack Query.
 * Replaces manual useEffect + useState + polling pattern with declarative config.
 * 
 * Features:
 * - Automatic polling with dynamic interval based on download activity
 * - Keeps previous data during refetch for smooth UI
 * - Pauses when document is hidden to save resources
 * 
 * @param downloadPath - Path to check disk space for
 * @param hasActiveDownloads - If true, polls faster (800ms vs 8s)
 */
export function useSystemStats(downloadPath: string, hasActiveDownloads: boolean) {
    return useQuery({
        queryKey: systemStatsKeys.byPath(downloadPath),
        queryFn: () => invoke<SystemStats>('get_system_stats', { downloadPath }),
        refetchInterval: hasActiveDownloads ? 800 : 8000,
        staleTime: hasActiveDownloads ? 500 : 5000,
        placeholderData: keepPreviousData,
        // Pause fetching when tab is hidden
        enabled: typeof document !== 'undefined' ? !document.hidden : true,
    })
}
