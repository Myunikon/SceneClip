/**
 * Process Utilities
 * 
 * Handles process management: spawning, killing, and tracking active processes.
 * Extracted from createVideoSlice for better modularity.
 */

import { Child, Command } from '@tauri-apps/plugin-shell'
import { type } from '@tauri-apps/plugin-os'

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

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Convert time string "HH:MM:SS.mm" or "MM:SS" or seconds to total seconds
 */
export function timeToSeconds(timeStr: string): number {
  if (!timeStr) return 0
  // If just number
  if (!timeStr.includes(':')) return parseFloat(timeStr) || 0

  const parts = timeStr.split(':').map(parseFloat)
  let seconds = 0
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1]
  }
  return seconds
}

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
    const osType = await type()

    if (osType === 'windows') {
      // Use PowerShell to kill the process and all children
      const cmd = Command.create('run-powershell', [
        '-NoProfile', '-Command',
        `$children = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq ${pid} }; ` +
        `foreach ($child in $children) { Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue }; ` +
        `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`
      ])
      const output = await cmd.execute()
      if (output.code !== 0) {
        // Decode stderr if it's not a string
        const stderr = typeof output.stderr === 'string' ? output.stderr : new TextDecoder().decode(output.stderr as any)
        logFn({ message: `[Kill] Failed to terminate PID ${pid}: ${stderr.substring(0, 100)}`, type: 'warning' })
      } else {
        logFn({ message: `[Kill] Terminated process tree for PID ${pid} (Windows)`, type: 'info' })
      }
    } else {
      // Unix (Linux/macOS): Use pkill -P to kill all child processes first
      try {
        const killChildren = Command.create('pkill', ['-P', String(pid)])
        await killChildren.execute()
      } catch {
        // pkill may fail if no children exist - this is fine
      }

      // Then kill the parent process with SIGKILL (-9)
      try {
        const killParent = Command.create('kill', ['-9', String(pid)])
        await killParent.execute()
      } catch {
        // Process may already be dead
      }

      logFn({ message: `[Kill] Terminated process tree for PID ${pid} (Unix)`, type: 'info' })
    }
  } catch (e) {
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
