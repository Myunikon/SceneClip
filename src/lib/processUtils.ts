/**
 * Process Utilities
 * 
 * Handles process management: spawning, killing, and tracking active processes.
 * Extracted from createVideoSlice for better modularity.
 */

import { Child } from '@tauri-apps/plugin-shell'
import { formatBytes, parseTime } from './utils'

// =============================================================================
// Types
// =============================================================================

export type LogFunction = (entry: { message: string, type: 'info' | 'error' | 'warning' }) => void

export interface ProgressInfo {
  percent: number
  speed: string
  eta: string
  totalSize?: string
}

// =============================================================================
// Module-level State (Singleton Pattern)
// =============================================================================

/** Map of task ID -> active Child process */
export const activeProcessMap = new Map<string, Child>()

/** Map of task ID -> PID for pause/resume */
export const activePidMap = new Map<string, number>()

/** Set of task IDs currently being started (race condition prevention) */
export const startingTaskIds = new Set<string>()

// =============================================================================
// Helper Functions
// =============================================================================

export { formatBytes }

/**
 * Convert time string "HH:MM:SS.mm" or "MM:SS" or seconds to total seconds
 */
export const timeToSeconds = parseTime

// =============================================================================
// Process Tree Kill (Cross-Platform)
// =============================================================================

/**
 * Kill a process and all its children (cross-platform)
 * 
 * Windows: Uses PowerShell to enumerate and kill child processes
 * Unix: Uses pkill -P to kill children, then kill -9 for parent
 */
export async function killProcessTree(pid: number, logFn: LogFunction): Promise<void> {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('kill_process_tree', { pid })
    logFn({ message: `[Kill] Terminated process tree for PID ${pid} (Backend)`, type: 'info' })
  } catch (e) {
    logFn({ message: `[Kill] Failed to terminate PID ${pid}: ${String(e)}`, type: 'warning' })
    console.warn('Process tree kill failed:', e)
  }
}

// =============================================================================
// Cleanup Helpers
// =============================================================================

/**
 * Clean up all process tracking for a given task ID
 */
export function cleanupTask(taskId: string): void {
  activeProcessMap.delete(taskId)
  activePidMap.delete(taskId)
  startingTaskIds.delete(taskId)
}
