/**
 * Typed Tauri Channels for Download Progress
 * 
 * This module provides TypeScript types matching the Rust DownloadEvent enum
 * for type-safe event streaming via Tauri Channels.
 * 
 * Usage:
 * ```typescript
 * const channel = new Channel<DownloadEvent>();
 * channel.onmessage = (message) => {
 *   switch (message.event) {
 *     case 'progress':
 *       updateTask(message.data.id, { progress: message.data.percent });
 *       break;
 *     case 'completed':
 *       updateTask(message.data.id, { status: 'completed' });
 *       break;
 *   }
 * };
 * await invoke('download_with_channel', { url, id, onEvent: channel });
 * ```
 */

import { invoke, Channel } from '@tauri-apps/api/core';

/**
 * Download event types for channel streaming
 * Mirrors Rust DownloadEvent enum
 */
export type DownloadEvent =
    | {
        event: 'started';
        data: {
            id: string;
            url: string;
            title: string | null;
            ytdlpCommand?: string;
        };
    }
    | {
        event: 'progress';
        data: {
            id: string;
            percent: number;
            speed: string;       // Formatted string
            eta: string;         // Formatted string
            total_size: string;  // Formatted string
            status: string;
            speed_raw?: number;
            eta_raw?: number;
        };
    }
    | {
        event: 'processing';
        data: {
            id: string;
            status: string;      // e.g., "Merging...", "Encoding..."
        };
    }
    | {
        event: 'completed';
        data: {
            id: string;
            filePath: string;
            fileSize: number;
        };
    }
    | {
        event: 'error';
        data: {
            id: string;
            message: string;
        };
    }
    | {
        event: 'cancelled';
        data: {
            id: string;
        };
    };

/**
 * Create a new download channel for streaming progress events
 * 
 * @example
 * const { channel, promise } = createDownloadChannel(taskId, updateTask);
 * await invoke('download_with_channel', { url, id: taskId, onEvent: channel });
 */
export function createDownloadChannel(
    _taskId: string,
    onProgress: (id: string, data: Partial<{
        progress: number | null;
        speed: string;
        speedRaw: number;
        eta: string;
        etaRaw: number;
        status: string;
        statusDetail: string;
        filePath: string;
        totalSize: string;
        ytdlpCommand: string;
    }>) => void
): Channel<DownloadEvent> {
    const channel = new Channel<DownloadEvent>();

    channel.onmessage = (message) => {
        switch (message.event) {
            case 'started':
                onProgress(message.data.id, {
                    status: 'fetching_info',
                    statusDetail: message.data.title || 'Starting download...',
                    ytdlpCommand: message.data.ytdlpCommand
                });
                break;

            case 'progress':
                onProgress(message.data.id, {
                    progress: message.data.percent,
                    speed: message.data.speed,
                    speedRaw: message.data.speed_raw || 0,
                    eta: message.data.eta,
                    etaRaw: message.data.eta_raw || 0,
                    totalSize: message.data.total_size,
                    status: 'downloading'
                });
                break;

            case 'processing':
                onProgress(message.data.id, {
                    progress: null, // Indeterminate
                    status: 'processing',
                    statusDetail: message.data.status
                });
                break;

            case 'completed':
                onProgress(message.data.id, {
                    progress: 100,
                    status: 'completed',
                    filePath: message.data.filePath
                });
                break;

            case 'error':
                onProgress(message.data.id, {
                    status: 'error',
                    statusDetail: message.data.message
                });
                break;

            case 'cancelled':
                onProgress(message.data.id, {
                    status: 'stopped'
                });
                break;
        }
    };

    return channel;
}

/**
 * Start a download with channel-based progress streaming
 * 
 * @param url - URL to download
 * @param id - Unique task ID
 * @param onProgress - Callback for progress updates
 */
export async function downloadWithChannel(
    url: string,
    id: string,
    onProgress: Parameters<typeof createDownloadChannel>[1]
): Promise<void> {
    const channel = createDownloadChannel(id, onProgress);

    await invoke('download_with_channel', {
        url,
        id,
        onEvent: channel
    });
}

/**
 * Cancel an active download by ID
 */
export async function cancelDownload(id: string): Promise<void> {
    await invoke('cancel_download', { id });
}
