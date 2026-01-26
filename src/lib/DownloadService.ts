/* eslint-disable @typescript-eslint/no-explicit-any */
import { Child } from '@tauri-apps/plugin-shell';
import { AppSettings, DownloadTask } from '../store/slices/types';
import { buildYtDlpArgs, parseYtDlpProgress, isErrorLine, getPostProcessStatusText, sanitizeFilename, parseYtDlpJson, getYtDlpCommand } from './ytdlp';
import { getUniqueFilePath, saveTempCookieFile } from './fileUtils';

// Define the callbacks interface for managing updates
export interface DownloadCallbacks {
    onProgress: (id: string, progress: Partial<DownloadTask>) => void;
    onLog: (id: string, message: string, type?: 'info' | 'error' | 'success' | 'warning') => void;
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
     * Terminate a running task process
     */
    public async stop(id: string): Promise<void> {
        const process = this.activeProcessMap.get(id);
        if (process) {
            try {
                await process.kill();
                this.activeProcessMap.delete(id);
                this.activePidMap.delete(id);
            } catch (e) {
                console.error(`Failed to kill process for task ${id}`, e);
            }
        }
    }

    /**
     * Start a download task
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
            callbacks.onLog(id, `Starting download for ${url}...`, 'info');

            // 1. Fetch Metadata (Simplified)
            let meta: any = null;
            try {
                callbacks.onLog(id, 'Fetching metadata...', 'info');
                const infoCmd = await getYtDlpCommand(['--dump-json', url], settings.binaryPathYtDlp);
                const infoOutput = await infoCmd.execute();
                meta = parseYtDlpJson(infoOutput.stdout);
                if (meta?.title) {
                    callbacks.onProgress(id, { title: meta.title });
                }
            } catch {
                callbacks.onLog(id, 'Metadata fetch failed, trying generic info...', 'warning');
                meta = { title: 'Unknown Video', ext: 'mp4', id: 'unknown' };
            }

            // 2. Prepare Filename
            const template = options?.customFilename || settings.filenameTemplate || '{title}';
            const finalName = sanitizeFilename(template, meta);

            // Determine Base Download Directory
            // Priority: Task-specific path > Settings path
            const downloadBaseDir = options?.path || settings.downloadPath;

            if (!downloadBaseDir) {
                throw new Error("Download path not set in settings or options.");
            }
            const { join } = await import('@tauri-apps/api/path');
            const fullOutputPathRaw = await join(downloadBaseDir, finalName);

            // FIX: Windows MAX_PATH Safety Check
            // We implement a "soft" limit of 250 to allow room for extension and potential temp suffixes
            let fullOutputPath = await getUniqueFilePath(fullOutputPathRaw);

            // Only enforce this strict limit on Windows
            const { type } = await import('@tauri-apps/plugin-os');
            const platform = await type();

            if (platform === 'windows' && fullOutputPath.length > 250) {
                callbacks.onLog(id, 'Filename too long for Windows, truncating...', 'warning');
                // Calculate how much we need to shave off
                const excess = fullOutputPath.length - 250;
                // We truncate from the filename, preserving extension
                // Logic: dirname + separator + filenameWithExt
                // We need to find the filename part again.
                // Since finalName was used, we can assume fullOutputPath ~= settings.downloadPath + finalName
                // But getUniqueFilePath might have added " (1)".

                // Simple heuristic: Take the last segment
                const lastSep = Math.max(fullOutputPath.lastIndexOf('/'), fullOutputPath.lastIndexOf('\\'));
                if (lastSep !== -1) {
                    const dir = fullOutputPath.substring(0, lastSep);
                    const name = fullOutputPath.substring(lastSep + 1);
                    const extIndex = name.lastIndexOf('.');
                    const ext = extIndex !== -1 ? name.substring(extIndex) : '';
                    const base = extIndex !== -1 ? name.substring(0, extIndex) : name;

                    if (base.length > excess) {
                        const newBase = base.substring(0, base.length - excess - 5); // Extra buffer
                        const newName = `${newBase}${ext}`;
                        fullOutputPath = await join(dir, newName);
                    }
                }
            }

            // 3. Handle Cookies
            let cookiePath = undefined;
            if (options?.cookies) {
                cookiePath = await saveTempCookieFile(options.cookies, id);
            }

            // 4. Build Arguments
            const ytDlpOptions = { ...options, cookies: cookiePath };
            const args = await buildYtDlpArgs(url, ytDlpOptions, settings, fullOutputPath, 'cpu'); // GPU Type should ideally be passed in or detected

            const commandStr = `yt-dlp ${args.join(' ')}`;
            callbacks.onLog(id, `Executing: ${commandStr}`, 'info');
            if (callbacks.onCommand) {
                callbacks.onCommand(id, commandStr);
            }

            // 5. Setup Command & Events
            const cmd = await getYtDlpCommand(args, settings.binaryPathYtDlp);
            const stderrBuffer: string[] = [];

            cmd.stdout.on('data', (line) => {
                const str = typeof line === 'string' ? line : new TextDecoder().decode(line);

                // NEW: Capture actual filename from yt-dlp output
                // This ensures we have the correct path even if yt-dlp changes extension or appends IDs
                if (str.includes('[Merger] Merging formats into')) {
                    const match = str.match(/"([^"]+)"/);
                    if (match && match[1]) {
                        fullOutputPath = match[1];
                        // callbacks.onLog(id, `Trace: Merged to ${fullOutputPath}`, 'info');
                    }
                } else if (str.includes('[download] Destination:')) {
                    const match = str.match(/Destination:\s+(.*)/);
                    if (match && match[1]) {
                        fullOutputPath = match[1].trim();
                    }
                }

                const progress = parseYtDlpProgress(str);
                if (progress) {
                    callbacks.onProgress(id, {
                        progress: progress.percent,
                        speed: progress.speed,
                        eta: progress.eta,
                        totalSize: progress.totalSize,
                        status: progress.isPostProcess ? 'processing' : 'downloading',
                        statusDetail: progress.isPostProcess ? getPostProcessStatusText(progress.postProcessType) : undefined
                    });
                }
            });

            cmd.stderr.on('data', (line) => {
                const str = typeof line === 'string' ? line : new TextDecoder().decode(line);
                if (isErrorLine(str)) {
                    stderrBuffer.push(str);
                    if (stderrBuffer.length > 10) stderrBuffer.shift();
                    callbacks.onLog(id, str, 'error');
                }
            });

            cmd.on('close', (data) => {
                // If it was removed from the map, it was likely stopped intentionally
                if (!this.activeProcessMap.has(id)) return;

                this.activeProcessMap.delete(id);
                this.activePidMap.delete(id);

                if (data.code === 0) {
                    callbacks.onComplete(id, { success: true, path: fullOutputPath });
                } else {
                    callbacks.onError(id, `Process exited with code ${data.code}. Last error: ${stderrBuffer.join('\n')}`);
                }
            });

            cmd.on('error', (err) => {
                // If it was removed from the map, it was likely stopped intentionally
                if (!this.activeProcessMap.has(id)) return;

                this.activeProcessMap.delete(id);
                this.activePidMap.delete(id);
                callbacks.onError(id, `Spawn error: ${err}`);
            });

            // 6. Spawn
            const child = await cmd.spawn();
            this.activeProcessMap.set(id, child);
            if (child.pid) {
                this.activePidMap.set(id, child.pid);
                callbacks.onProgress(id, { pid: child.pid, status: 'downloading', filePath: fullOutputPath });
            }

        } catch (error: any) {
            callbacks.onError(id, error.message || String(error));
        }
    }
}
