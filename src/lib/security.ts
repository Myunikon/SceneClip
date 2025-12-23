
import { lstat, exists } from '@tauri-apps/plugin-fs'
import { normalize } from '@tauri-apps/api/path'

/**
 * Security Utility Module
 * Implements strict checks for binary execution integrity.
 */

/**
 * Verifies that a path is safe to execute:
 * 1. Must exist
 * 2. Must be strictly inside the allowed parent directory (No Path Traversal)
 * 3. Must NOT be a symlink (Prevent Symlink Attacks)
 */
export async function verifyPathSafety(targetPath: string, allowedParentDir: string): Promise<boolean> {
    try {
        // 1. Existence Check
        if (!(await exists(targetPath))) return false

        // 2. Symlink Check
        // lstat returns info about the link itself, stat follows connection
        const info = await lstat(targetPath)
        if (info.isSymlink) {
            console.error(`[Security] Symlink detected at ${targetPath}. execution denied.`)
            return false
        }

        // 3. Path Traversal Check
        // We normalize paths to handle '..'
        // Note: Tauri's path API might be async or sync depending on version, assumed v2 usage based on existing code.
        // But Tauri API usually returns promises for path ops.
        // Wait, 'normalize' is usually sync in node but Tauri? 
        // Checking imports in other files... 'join' is imported from @tauri-apps/api/path
        
        // Simple string check usually suffices if full paths are resolved
        // Assuming allowedParentDir is absolute and targetPath is absolute.
        // We can check if targetPath starts with allowedParentDir
        
        // Ensure standard separators
        // 3. Path Traversal Check
        // Use Tauri's normalize to handle '..' and separators consistently across OS
        const parent = await normalize(allowedParentDir)
        const target = await normalize(targetPath)

        if (!target.startsWith(parent)) {
             console.error(`[Security] Path Traversal detected! ${target} is not inside ${parent}`)
             return false
        }

        return true
    } catch (e) {
        console.error("Path safety check failed:", e)
        return false
    }
}
