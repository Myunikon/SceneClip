/* eslint-disable @typescript-eslint/no-explicit-any */
import { Child } from '@tauri-apps/plugin-shell';
import { invoke } from '@tauri-apps/api/core';
import { AppSettings, DownloadTask } from '../store/slices/types';
import { useAppStore } from '../store';
import { saveTempCookieFile } from './fileUtils';
import { matchDomain } from './validators';

// Define the callbacks interface for managing updates
export interface DownloadCallbacks {
    onProgress: (id: string, progress: Partial<DownloadTask>) => void;
    onLog: (id: string, message: string, type?: 'info' | 'error' | 'success' | 'warning', source?: 'system' | 'ytdlp' | 'ffmpeg') => void;
    onCommand?: (id: string, command: string) => void;
    onComplete: (id: string, result: any) => void;
    onError: (id: string, error: string) => void;
}

export class DownloadService {
    private static instance: DownloadService;
    private activeProcessMap: Map<string, Child> = new Map();
    private activePidMap: Map<string, number> = new Map();

    private constructor() { }

    public static getInstance(): DownloadService {
        if (!DownloadService.instance) {
            DownloadService.instance = new DownloadService();
        }
        return DownloadService.instance;
    }





    /**
     * Pause a running task process (Non-Destructive)
     */
    public async pause(id: string): Promise<void> {
        const pid = this.activePidMap.get(id);
        if (pid) {
            try {
                await invoke('suspend_process', { pid });
                // Do NOT delete from maps, we need PID to resume
            } catch (e) {
                console.error(`Failed to suspend process for task ${id}`, e);
            }
        }
    }

    /**
     * Terminate a running task process
     */
    public async stop(id: string): Promise<void> {
        try {
            await invoke('cancel_download', { id });
            // Cleanup local maps just in case (though unused now)
            this.activeProcessMap.delete(id);
            this.activePidMap.delete(id);
        } catch (e) {
            console.error(`Failed to stop download ${id}`, e);
        }
    }

    /**
     * Start a download task via Rust Backend
     */
    public async start(
        task: DownloadTask,
        settings: AppSettings,
        callbacks: DownloadCallbacks
    ): Promise<void> {
        const { id, url } = task;
        // Fix for typed/untyped mixup
        const options = (task as any)._options || (task as any).options || {};

        try {
            callbacks.onLog(id, `Starting download via Rust backend for ${url}...`, 'info', 'ytdlp');

            // Import Channel for event streaming
            const { Channel } = await import('@tauri-apps/api/core');

            const channel = new Channel<any>();
            channel.onmessage = (msg: any) => {
                const event = msg.event;
                const data = msg.data;

                switch (event) {
                    case 'started':
                        if (data.title) {
                            callbacks.onProgress(id, { title: data.title });
                        }
                        break;
                    case 'progress':
                        callbacks.onProgress(id, {
                            progress: data.percent,
                            speed: data.speed,
                            eta: data.eta,
                            totalSize: data.totalSize,
                            status: data.status,
                            speedRaw: data.speedRaw, // Optional backend support
                            etaRaw: data.etaRaw
                        });
                        break;
                    case 'log':
                        callbacks.onLog(id, data.message, data.level as any, 'system');
                        break;
                    case 'completed':
                        callbacks.onComplete(id, { success: true, path: data.filePath });
                        break;
                    case 'error':
                        callbacks.onError(id, data.message);
                        break;
                    case 'cancelled':
                        callbacks.onLog(id, "Download cancelled", "warning");
                        break;
                }
            };

            // 3.5. Keyring Lookup (Still needed in frontend to pass to backend?)
            // Actually `ytdlp.ts` (legacy) handled this. The new Rust `ytdlp.rs` has fields for username/password.
            // But `DownloadService` retrieves them from Keyring.
            // Check if Rust can access Keyring directly? 
            // `settings` passed to Rust contains `savedCredentials`.
            // BUT the password itself is in the secure keychain, not in settings.json.
            // Rust `download_with_channel` doesn't do Keyring lookup logic yet (it logic was in TS).
            // We should pass credentials explicitly in `options`.

            let keyringCreds: { username?: string, password?: string } = {};
            if (settings.savedCredentials?.length > 0) {
                // Match domain logic
                const cred = settings.savedCredentials.find(c => matchDomain(url, c.service));
                if (cred) {
                    callbacks.onLog(id, `Found credentials for ${cred.service}, unlocking...`, 'info');
                    const password = await invoke<string>('get_credential', { service: cred.service, username: cred.username });
                    if (password) {
                        keyringCreds = { username: cred.username, password };
                    }
                }
            }

            // 3. Handle Cookies (Frontend Helper)
            // `saveTempCookieFile` writes to disk. Rust can read it if passed path.
            let cookiePath = undefined;
            if (options?.cookies) {
                // We still use the TS helper to write the temp file
                cookiePath = await saveTempCookieFile(options.cookies, id);
            }

            const gpuType = useAppStore.getState().gpuType;

            const finalOptions = { ...options, ...keyringCreds, cookies: cookiePath };

            // Invoke Rust Command
            await invoke('download_with_channel', {
                url,
                id,
                options: finalOptions,
                settings,
                gpuType, // Pass GPU Type
                onEvent: channel
            });

        } catch (error: any) {
            callbacks.onError(id, error.message || String(error));
        }
    }
}
