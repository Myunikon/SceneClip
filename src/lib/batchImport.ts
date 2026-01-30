import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'

/**
 * Open file picker and import URLs from text file using Rust backend
 */
export async function importBatchFile(): Promise<{
    urls: string[]
    filePath: string | null
    error?: string
}> {
    try {
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

        // Use backend to read and parse file ensures consistency and performance
        const urls = await invoke<string[]>('parse_batch_file', { path: filePath })

        return { urls, filePath }
    } catch (error) {
        return {
            urls: [],
            filePath: null,
            error: String(error)
        }
    }
}

// Kept for UI Reference if needed
export function generateSampleBatchContent(): string {
    return `# Batch URL Import File
# Lines starting with # are comments
# One URL per line

https://www.youtube.com/watch?v=example1
https://www.youtube.com/watch?v=example2
`
}
