import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { DiskStats } from '../../types'

export function useDiskStats(path: string, isOpen: boolean) {
    const [diskFreeSpace, setDiskFreeSpace] = useState<number | null>(null)

    useEffect(() => {
        if (!isOpen) return

        const checkDisk = async () => {
            try {
                // Fetch stats for the target drive
                const res = await invoke<DiskStats>('get_system_stats', { downloadPath: path || '.' })
                if (res) {
                    setDiskFreeSpace(res.disk_free)
                }
            } catch {
                // Silent fail is fine, we just won't warn
            }
        }

        checkDisk()
    }, [path, isOpen])

    return { diskFreeSpace }
}
