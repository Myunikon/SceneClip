
import { Child } from '@tauri-apps/plugin-shell';
import { AppSettings, DownloadTask } from '../store/slices/types';
import { buildYtDlpArgs, parseYtDlpProgress, isErrorLine, getPostProcessStatusText, sanitizeFilename, parseYtDlpJson, getYtDlpCommand } from './ytdlp';
import { getUniqueFilePath, saveTempCookieFile } from './fileUtils';

// Define the callbacks interface for managing updates
export interface DownloadCallbacks {
    onProgress: (id: string, progress: Partial<DownloadTask>) => void;
    onLog: (id: string, message: string, type?: 'info' | 'error' | 'success' | 'warning') => void;
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
                const infoCmd = await getYtDlpCommand(['--dump-json', url]);
                const infoOutput = await infoCmd.execute();
                meta = parseYtDlpJson(infoOutput.stdout);
            } catch (e) {
                callbacks.onLog(id, 'Metadata fetch failed, trying generic info...', 'warning');
                meta = { title: 'Unknown Video', ext: 'mp4', id: 'unknown' };
            }

            // 2. Prepare Filename
            let template = options?.customFilename || settings.filenameTemplate || '{title}';
            let finalName = sanitizeFilename(template, meta);

            if (!settings.downloadPath) {
                throw new Error("Download path not set in settings.");
            }
            const { join } = await import('@tauri-apps/api/path');
            const fullOutputPathRaw = await join(settings.downloadPath, finalName);
            const fullOutputPath = await getUniqueFilePath(fullOutputPathRaw);

            // 3. Handle Cookies
            let cookiePath = undefined;
            if (options?.cookies) {
                cookiePath = await saveTempCookieFile(options.cookies, id);
            }

            // 4. Build Arguments
            const ytDlpOptions = { ...options, cookies: cookiePath };
            const args = await buildYtDlpArgs(url, ytDlpOptions, settings, fullOutputPath, 'cpu'); // GPU Type should ideally be passed in or detected

            callbacks.onLog(id, `Executing: yt-dlp ${args.join(' ')}`, 'info');

            // 5. Setup Command & Events
            const cmd = await getYtDlpCommand(args);
            const stderrBuffer: string[] = [];

            cmd.stdout.on('data', (line) => {
                const str = typeof line === 'string' ? line : new TextDecoder().decode(line);
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
                this.activeProcessMap.delete(id);
                this.activePidMap.delete(id);

                if (data.code === 0) {
                    callbacks.onComplete(id, { success: true, path: fullOutputPath });
                } else {
                    callbacks.onError(id, `Process exited with code ${data.code}. Last error: ${stderrBuffer.join('\n')}`);
                }
            });

            cmd.on('error', (err) => {
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
