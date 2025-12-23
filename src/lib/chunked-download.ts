/**
 * Chunked Download Utility
 * Downloads files in chunks to enable real pause/resume functionality
 */

import { open, exists, stat, remove } from '@tauri-apps/plugin-fs'
import { fetch } from '@tauri-apps/plugin-http'

export interface ChunkedDownloadProgress {
    loaded: number
    total: number
    speed: number
    chunkIndex: number
    totalChunks: number
    canPause: boolean
}

export interface ChunkedDownloadOptions {
    chunkSize?: number  // Default 2MB
    onProgress: (progress: ChunkedDownloadProgress) => void
    isPaused: () => boolean  // Function to check if download should pause
}

export interface ChunkedDownloadResult {
    success: boolean
    completed: boolean  // false if paused mid-way
    totalBytes: number
    resumePosition: number  // Where to resume from if paused
}

const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024  // 2MB chunks

/**
 * Downloads a file in chunks, allowing pause between chunks
 * This enables real pause/resume for HTTP downloads
 */
export async function downloadFileChunked(
    url: string,
    filePath: string,
    options: ChunkedDownloadOptions
): Promise<ChunkedDownloadResult> {
    const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE
    
    // First, get the total file size with a HEAD request
    let totalSize = 0
    let supportsRange = false
    
    try {
        const headResponse = await fetch(url, { method: 'HEAD' })
        const contentLength = headResponse.headers.get('content-length')
        totalSize = contentLength ? parseInt(contentLength, 10) : 0
        
        // Check if server accepts Range requests
        const acceptRanges = headResponse.headers.get('accept-ranges')
        supportsRange = acceptRanges === 'bytes' || headResponse.headers.has('content-range')
        
        // If HEAD didn't give us content-length, try a small Range request
        if (totalSize === 0) {
            const rangeTest = await fetch(url, { 
                method: 'GET',
                headers: { 'Range': 'bytes=0-0' }
            })
            if (rangeTest.status === 206) {
                supportsRange = true
                const contentRange = rangeTest.headers.get('content-range')
                if (contentRange) {
                    const match = contentRange.match(/\/(\d+)$/)
                    if (match) totalSize = parseInt(match[1], 10)
                }
            }
        }
    } catch (e) {
        console.warn('[ChunkedDownload] HEAD request failed, will try direct download:', e)
    }
    
    // If server doesn't support Range, fall back to regular download
    if (!supportsRange || totalSize === 0) {
        console.log('[ChunkedDownload] Server does not support Range requests, using fallback')
        return await fallbackDownload(url, filePath, options, totalSize)
    }
    
    console.log(`[ChunkedDownload] Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB, Chunk size: ${(chunkSize / 1024 / 1024).toFixed(2)} MB`)
    
    // Check for existing partial download
    let startByte = 0
    if (await exists(filePath + '.part')) {
        try {
            const partInfo = await stat(filePath + '.part')
            startByte = partInfo.size
            console.log(`[ChunkedDownload] Resuming from byte ${startByte}`)
        } catch (e) {
            startByte = 0
        }
    }
    
    const totalChunks = Math.ceil((totalSize - startByte) / chunkSize)
    let currentByte = startByte
    let chunkIndex = 0
    let lastTime = Date.now()
    let lastBytes = startByte
    
    // Open file for appending
    const fileHandle = await open(filePath + '.part', {
        write: true,
        append: startByte > 0,
        truncate: startByte === 0,
        create: true
    })
    
    try {
        while (currentByte < totalSize) {
            // Check if paused BEFORE starting a new chunk
            if (options.isPaused()) {
                console.log(`[ChunkedDownload] Paused at byte ${currentByte}`)
                await fileHandle.close()
                return {
                    success: true,
                    completed: false,
                    totalBytes: currentByte,
                    resumePosition: currentByte
                }
            }
            
            const endByte = Math.min(currentByte + chunkSize - 1, totalSize - 1)
            
            // Download this chunk
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Range': `bytes=${currentByte}-${endByte}`
                }
            })
            
            if (response.status !== 206 && response.status !== 200) {
                throw new Error(`Chunk download failed: ${response.status} ${response.statusText}`)
            }
            
            const data = new Uint8Array(await response.arrayBuffer())
            await fileHandle.write(data)
            
            currentByte += data.length
            chunkIndex++
            
            // Calculate speed
            const now = Date.now()
            const elapsed = (now - lastTime) / 1000
            const speed = elapsed > 0 ? (currentByte - lastBytes) / elapsed : 0
            
            // Report progress
            options.onProgress({
                loaded: currentByte,
                total: totalSize,
                speed,
                chunkIndex,
                totalChunks,
                canPause: true
            })
            
            // Update speed tracking every second
            if (elapsed >= 1) {
                lastTime = now
                lastBytes = currentByte
            }
        }
        
        await fileHandle.close()
        
        // Rename .part to final file
        const { rename } = await import('@tauri-apps/plugin-fs')
        
        // Remove existing file if any
        if (await exists(filePath)) {
            await remove(filePath)
        }
        await rename(filePath + '.part', filePath)
        
        console.log('[ChunkedDownload] Download complete!')
        return {
            success: true,
            completed: true,
            totalBytes: totalSize,
            resumePosition: totalSize
        }
        
    } catch (e) {
        await fileHandle.close()
        throw e
    }
}

/**
 * Fallback for servers that don't support Range requests
 * This cannot be paused mid-download
 */
async function fallbackDownload(
    url: string,
    filePath: string,
    options: ChunkedDownloadOptions,
    knownSize: number
): Promise<ChunkedDownloadResult> {
    console.log('[ChunkedDownload] Using fallback (non-resumable) download')
    
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }
    
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')
    
    const contentLength = response.headers.get('content-length')
    const total = knownSize || (contentLength ? parseInt(contentLength, 10) : 0)
    
    const fileHandle = await open(filePath + '.part', {
        write: true,
        truncate: true,
        create: true
    })
    
    let loaded = 0
    let lastTime = Date.now()
    let lastLoaded = 0
    
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            if (value) {
                await fileHandle.write(value)
                loaded += value.length
                
                const now = Date.now()
                const elapsed = (now - lastTime) / 1000
                
                if (elapsed >= 0.2) {
                    const speed = (loaded - lastLoaded) / elapsed
                    options.onProgress({
                        loaded,
                        total,
                        speed,
                        chunkIndex: 0,
                        totalChunks: 1,
                        canPause: false  // Cannot pause fallback download
                    })
                    lastTime = now
                    lastLoaded = loaded
                }
            }
        }
        
        await fileHandle.close()
        reader.releaseLock()
        
        // Rename to final
        const { rename } = await import('@tauri-apps/plugin-fs')
        if (await exists(filePath)) {
            await remove(filePath)
        }
        await rename(filePath + '.part', filePath)
        
        return {
            success: true,
            completed: true,
            totalBytes: loaded,
            resumePosition: loaded
        }
        
    } catch (e) {
        await fileHandle.close()
        reader.releaseLock()
        throw e
    }
}
