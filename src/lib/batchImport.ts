/**
 * Batch Import Utility
 * 
 * Inspired by Parabolic's validateBatchFile
 * Import multiple URLs from a text file
 * 
 * @see Context7: @tauri-apps/plugin-dialog, @tauri-apps/plugin-fs
 */

import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'

/**
 * Validate if a string is a valid URL
 */
function isValidUrl(str: string): boolean {
    try {
        const url = new URL(str)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

/**
 * Parse URLs from batch file content
 * Supports:
 * - One URL per line
 * - Comments starting with #
 * - Empty lines (ignored)
 */
export function parseBatchContent(content: string): string[] {
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
            // Ignore empty lines and comments
            if (!line || line.startsWith('#')) return false
            // Validate URL
            return isValidUrl(line)
        })
}

/**
 * Open file picker and import URLs from text file
 */
export async function importBatchFile(): Promise<{
    urls: string[]
    filePath: string | null
    error?: string
}> {
    try {
        // Open file picker
        const selected = await open({
            title: 'Import URL List',
            filters: [
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] }
            ],
            multiple: false,
            directory: false
        })

        if (!selected) {
            return { urls: [], filePath: null }
        }

        const filePath = selected as string

        // Read file content
        const content = await readTextFile(filePath)

        // Parse URLs
        const urls = parseBatchContent(content)

        return { urls, filePath }
    } catch (error) {
        return {
            urls: [],
            filePath: null,
            error: String(error)
        }
    }
}

/**
 * Generate sample batch file content
 */
export function generateSampleBatchContent(): string {
    return `# Batch URL Import File
# Lines starting with # are comments
# One URL per line

https://www.youtube.com/watch?v=example1
https://www.youtube.com/watch?v=example2
https://www.youtube.com/playlist?list=PLexample

# You can also add URLs from other supported sites
# https://vimeo.com/123456789
`
}
