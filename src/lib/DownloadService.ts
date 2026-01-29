/* eslint-disable @typescript-eslint/no-explicit-any */
import { Child } from '@tauri-apps/plugin-shell';
import { invoke } from '@tauri-apps/api/core';
import { AppSettings, DownloadTask } from '../store/slices/types';
import { useAppStore } from '../store';
import { buildYtDlpArgs, parseYtDlpProgress, isErrorLine, getPostProcessStatusText, sanitizeFilename, parseYtDlpJson, getYtDlpCommand } from './ytdlp';
import { getUniqueFilePath, saveTempCookieFile } from './fileUtils';
import { formatSpeed, formatBytes } from './formatters';
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
        const process = this.activeProcessMap.get(id);
        if (process) {
            try {
                // If it was paused, we must resume it first before killing to ensure clean exit?
                // Or just kill. Kill works on suspended processes in Windows usually.
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
            // Check if we are resuming a PAUSED process (not stopped)
            if (this.activePidMap.has(id)) {
                // We have a PID, try to RESUME via OS Signal
                try {
                    const pid = this.activePidMap.get(id);
                    await invoke('resume_process', { pid });
                    callbacks.onLog(id, `Process resumed (PID: ${pid})`, 'info', 'system');
                    callbacks.onProgress(id, { status: 'downloading', speed: 'Resuming...', eta: '...' });
                    return; // EXIT EARLY, do not respawn
                } catch (e) {
                    callbacks.onLog(id, `Failed to resume process: ${e}. Restarting...`, 'warning', 'system');
                    // Fallthrough to normal restart logic
                }
            }

            callbacks.onLog(id, `Starting download for ${url}...`, 'info', 'ytdlp');

            // 1. Fetch Metadata (Simplified)
            let meta: any = null;
            try {
                callbacks.onLog(id, 'Fetching metadata...', 'info', 'ytdlp');
                const infoCmd = await getYtDlpCommand(['--dump-json', url], settings.binaryPathYtDlp);
                const infoOutput = await infoCmd.execute();
                meta = parseYtDlpJson(infoOutput.stdout);
                if (meta?.title) {
                    callbacks.onProgress(id, { title: meta.title });
                }
            } catch {
                callbacks.onLog(id, 'Metadata fetch failed, trying generic info...', 'warning', 'ytdlp');
                meta = { title: 'Unknown Video', ext: 'mp4', id: 'unknown' };
            }

            // 2. Prepare Filename
            const template = options?.customFilename || settings.filenameTemplate || '{title}';
            const finalName = sanitizeFilename(template, meta, options);

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
                callbacks.onLog(id, 'Filename too long for Windows, truncating...', 'warning', 'system');
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
                        fullOutputPath = await getUniqueFilePath(await join(dir, newName));
                    }
                }
            }

            // 3. Handle Cookies
            let cookiePath = undefined;
            if (options?.cookies) {
                cookiePath = await saveTempCookieFile(options.cookies, id);
            }


            // 3.5. Keyring Lookup
            let keyringCreds: { username?: string, password?: string } = {};
            if (settings.savedCredentials?.length > 0) {
                try {
                    // Robust domain matching
                    const match = settings.savedCredentials.find(cred => {
                        return matchDomain(url, cred.service);
                    });

                    if (match) {
                        callbacks.onLog(id, `Found credentials for ${match.service}, unlocking...`, 'info');
                        const password = await invoke<string>('get_credential', { service: match.service, username: match.username });
                        if (password) {
                            keyringCreds = { username: match.username, password };
                        }
                    }
                } catch (e) {
                    callbacks.onLog(id, `Keyring lookup failed: ${e}`, 'warning', 'system');
                }
            }

            // 4. Build Arguments
            const ytDlpOptions = { ...options, ...keyringCreds, cookies: cookiePath };
            const gpuType = useAppStore.getState().gpuType;
            const args = await buildYtDlpArgs(url, ytDlpOptions, settings, fullOutputPath, gpuType);

            // SECURITY: Redact sensitive information from logs
            const secureArgs = args.map((arg, index) => {
                const prevArg = index > 0 ? args[index - 1] : '';

                // 1. Redact values following sensitive keys
                const sensitiveKeys = ['--password', '--video-password', '--username', '--proxy-password'];
                if (sensitiveKeys.includes(prevArg)) return '********';

                // 2. Redact key=value pairs
                if (arg.startsWith('--password=')) return '--password=********';
                if (arg.startsWith('--video-password=')) return '--video-password=********';
                if (arg.startsWith('--username=')) return '--username=********';

                // 3. Redact proxy with credentials (e.g. http://user:pass@host)
                if (prevArg === '--proxy' && arg.includes('@') && arg.includes(':')) {
                    try {
                        const url = new URL(arg);
                        if (url.username || url.password) {
                            return `${url.protocol}//********:********@${url.host}${url.pathname}${url.search}`;
                        }
                    } catch {
                        return '********'; // Fallback
                    }
                }

                return arg;
            });

            const commandStr = `yt-dlp ${secureArgs.join(' ')}`;
            callbacks.onLog(id, `Executing: ${commandStr}`, 'info', 'system');
            if (callbacks.onCommand) {
                callbacks.onCommand(id, commandStr);
            }

            // 5. Setup Command & Events
            const cmd = await getYtDlpCommand(args, settings.binaryPathYtDlp);
            const stderrBuffer: string[] = [];

            cmd.stdout.on('data', (line) => {
                const str = typeof line === 'string' ? line : new TextDecoder().decode(line);

                // PARABOLIC: Template Parsing (Priority 1)
                if (str.startsWith('SCENECLIP_PROGRESS;')) {
                    const parts = str.split(';');
                    // Format: SCENECLIP_PROGRESS;status;downloaded;total;total_estimate;speed;eta
                    if (parts.length >= 7) {
                        const downloaded = parseFloat(parts[2]);
                        const total = parts[3] !== 'NA' ? parseFloat(parts[3]) : parseFloat(parts[4]);
                        const speedVal = parseFloat(parts[5]);
                        const etaVal = parseInt(parts[6]);

                        // Calculate percentage manually if we have total
                        let percent = 0;
                        if (total > 0) percent = (downloaded / total) * 100;

                        callbacks.onProgress(id, {
                            progress: percent,
                            speed: isNaN(speedVal) ? '-' : formatSpeed(speedVal),
                            speedRaw: isNaN(speedVal) || !isFinite(speedVal) ? undefined : speedVal,
                            eta: isNaN(etaVal) ? '-' : `${etaVal}s`,
                            etaRaw: isNaN(etaVal) || !isFinite(etaVal) ? undefined : etaVal,
                            totalSize: isNaN(total) ? '-' : formatBytes(total),
                            status: 'downloading'
                        });
                        return; // Skip other parsers
                    }
                }

                // PARABOLIC: Aria2c Parsing (Priority 2)
                // Example: [#2089b0 1.2MiB/9.5MiB(12%) CN:1 DL:3.4MiB/s]
                if (str.includes('[#')) {
                    const match = str.match(/\[#\w+\s+([0-9.]+\w+)\/([0-9.]+\w+)\(([0-9.]+)%\)/)
                    if (match) {
                        callbacks.onProgress(id, {
                            progress: parseFloat(match[3]),
                            totalSize: match[2],
                            status: 'downloading',
                            speed: str.match(/DL:([0-9.]+\w+\/s)/)?.[1] || '-',
                            eta: str.match(/ETA:([0-9a-zs]+)/)?.[1] || '-'
                        });
                        return;
                    }
                }

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

                // Legacy/Fallback Regex Parser (std output)
                // Only runs if NOT using template/aria2c (e.g. older yt-dlp or different mode)
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
                    callbacks.onLog(id, str, 'error', 'ytdlp');
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
