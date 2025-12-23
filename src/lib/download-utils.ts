
/**
 * Utility for streaming downloads validation and progress calculation
 */

export interface DownloadProgress {
    loaded: number
    total: number
    speed: number // bytes per second
}

export interface DownloadResult {
    success: boolean
    resumeWorked: boolean  // True if we actually resumed, false if we had to restart
    finalSize: number
}

export async function downloadWithProgress(
    url: string,
    onProgress: (progress: DownloadProgress) => void,
    signal?: AbortSignal
): Promise<Uint8Array> {
    const { fetch } = await import('@tauri-apps/plugin-http')
    
    // Pass signal to fetch for network-level cancellation
    const response = await fetch(url, { signal })
    if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
    }

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    const reader = response.body?.getReader()

    if (!reader) throw new Error('ReadableStream not supported')

    const chunks: Uint8Array[] = []
    let loaded = 0
    let lastUpdate = Date.now()
    let lastLoaded = 0

    try {
        while (true) {
            // Check for manual abort before reading (though fetch signal usually handles this)
            if (signal?.aborted) {
                reader.cancel()
                throw new Error('Download aborted by user')
            }

            const { done, value } = await reader.read()
            if (done) break
            
            if (value) {
                chunks.push(value)
                loaded += value.length
            
                const now = Date.now()
                const elapsed = (now - lastUpdate) / 1000 // seconds
                
                // Update every 200ms
                if (elapsed > 0.2) {
                    const speed = elapsed > 0 ? (loaded - lastLoaded) / elapsed : 0
                    onProgress({ loaded, total, speed })
                    
                    lastUpdate = now
                    lastLoaded = loaded
                }
            }
        }
    } finally {
        reader.releaseLock()
    }
    
    // Final update
    onProgress({ loaded, total, speed: 0 })

    // Merge chunks
    const totalLength = chunks.reduce((acc, val) => acc + val.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
    }
    
    return result
}

export async function downloadToFileWithProgress(
    url: string,
    filePath: string,
    onProgress: (progress: DownloadProgress) => void,
    signal?: AbortSignal,
    resumeFrom: number = 0
): Promise<DownloadResult> {
    const { fetch } = await import('@tauri-apps/plugin-http')
    // Use 'open' for FileHandle access to support appending
    const { open } = await import('@tauri-apps/plugin-fs')
    
    let startByte = resumeFrom
    
    const headers: Record<string, string> = {}
    if (startByte > 0) {
        headers['Range'] = `bytes=${startByte}-`
    }

    const response = await fetch(url, { 
        method: 'GET',
        headers,
        signal 
    })

    if (!response.ok) {
        if (response.status === 416) { 
             throw new Error(`Download failed: Server returned 416 Range Not Satisfiable`)
        }
        throw new Error(`Download failed: ${response.statusText} (${response.status})`)
    }
    
    // Check if server accepted Range - BE TRANSPARENT!
    let resumeActuallyWorked = false
    if (startByte > 0 && response.status === 206) {
        // Server accepted our Range header - resume is working!
        resumeActuallyWorked = true
        console.log(`[Resume] Server accepted Range. Resuming from byte ${startByte}`)
    } else if (startByte > 0 && response.status === 200) {
        // Server ignored Range header, returned full file. We MUST restart.
        console.warn(`[Resume] Server rejected Range header (returned 200). Restarting from beginning.`)
        startByte = 0 
    }

    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) + startByte : 0
    let totalSize = total
    
    if (response.status === 206) {
        const contentRange = response.headers.get('content-range')
        if (contentRange) {
             const match = contentRange.match(/\/(\d+)$/)
             if (match) totalSize = parseInt(match[1], 10)
        }
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('ReadableStream not supported')

    let loaded = startByte
    let lastUpdate = Date.now()
    let lastLoaded = startByte
    
    // Open file: Append if resuming, Truncate if new (or if server reset us)
    const fileHandle = await open(filePath, { 
        write: true, 
        append: startByte > 0, 
        truncate: startByte === 0,
        create: true 
    })

    // Buffer 1MB
    let buffer: Uint8Array = new Uint8Array(0)
    const MAX_BUFFER_SIZE = 1024 * 1024 

    try {
        while (true) {
            if (signal?.aborted) {
                 reader.cancel()
                 throw new Error('Download aborted by user')
            }

            const { done, value } = await reader.read()
            
            if (value) {
                const newBuffer = new Uint8Array(buffer.length + value.length)
                newBuffer.set(buffer)
                newBuffer.set(value, buffer.length)
                buffer = newBuffer
                
                loaded += value.length
            }

            if (buffer.length >= MAX_BUFFER_SIZE || (done && buffer.length > 0)) {
                 await fileHandle.write(buffer)
                 buffer = new Uint8Array(0) // Clear buffer
            }

            if (done) break
            
            const now = Date.now()
            const elapsed = (now - lastUpdate) / 1000
            if (elapsed > 0.2) {
                const speed = elapsed > 0 ? (loaded - lastLoaded) / elapsed : 0
                onProgress({ loaded, total: totalSize, speed })
                lastUpdate = now
                lastLoaded = loaded
            }
        }
    } finally {
        // Ensure we close the file and release lock
        try {
            await fileHandle.close()
        } catch (e) {
            console.warn('Failed to close file handle', e)
        }
        reader.releaseLock()
    }
    
    return {
        success: true,
        resumeWorked: resumeActuallyWorked,
        finalSize: loaded
    }
}
