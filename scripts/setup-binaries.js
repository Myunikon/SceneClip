import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { createWriteStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN_DIR = path.resolve(__dirname, '../src-tauri');

if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
}

// Configuration for all supported targets
const TARGETS = {
    'win-x64': {
        triple: 'x86_64-pc-windows-msvc',
        platform: 'win32',
        arch: 'x64',
        ffmpegUrl: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
        ext: '.exe'
    },
    'mac-x64': {
        triple: 'x86_64-apple-darwin',
        platform: 'darwin',
        arch: 'x64',
        ffmpegUrl: 'https://evermeet.cx/ffmpeg/getrelease/zip',
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
        ext: ''
    },
    'mac-arm64': {
        triple: 'aarch64-apple-darwin',
        platform: 'darwin',
        arch: 'arm64',
        // Strategy: Use x64 build via Rosetta 2 (Standard practice for broad compat)
        ffmpegUrl: 'https://evermeet.cx/ffmpeg/getrelease/zip',
        // Strategy: Use Universal Binary (Native support for both)
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
        ext: ''
    },
    'linux-x64': {
        triple: 'x86_64-unknown-linux-gnu',
        platform: 'linux',
        arch: 'x64',
        ffmpegUrl: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
        ext: ''
    }
};

// Helper: Get Current Target Key
const getCurrentTargetKey = () => {
    const p = process.platform;
    const a = process.arch;
    if (p === 'win32') return 'win-x64';
    if (p === 'linux') return 'linux-x64';
    if (p === 'darwin') return a === 'arm64' ? 'mac-arm64' : 'mac-x64';
    return null;
};

// Helper: Download File
const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const makeRequest = (currentUrl) => {
            const protocol = currentUrl.startsWith('https') ? https : http;
            protocol.get(currentUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SceneClip/1.0)' }
            }, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    makeRequest(response.headers.location);
                    return;
                }
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                    return;
                }
                const file = createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => resolve(dest));
                });
            }).on('error', (err) => {
                try { fs.unlinkSync(dest); } catch (e) { }
                reject(err);
            });
        };
        makeRequest(url);
    });
};

// Helper: Extract Archive
async function extractArchive(filePath, destDir) {
    const ext = path.extname(filePath).toLowerCase();
    console.log(`[EXTRACT] ${path.basename(filePath)}...`);

    try {
        if (ext === '.zip') {
            if (process.platform === 'win32') {
                await execAsync(`powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${destDir}' -Force"`);
            } else {
                await execAsync(`unzip -o "${filePath}" -d "${destDir}"`);
            }
        } else if (filePath.endsWith('.tar.xz')) {
            // Use tar. On Windows 10+, tar.exe is usually available.
            await execAsync(`tar -xf "${filePath}" -C "${destDir}"`);
        } else {
            throw new Error(`Unsupported archive format: ${ext}`);
        }
    } catch (e) {
        throw new Error(`Extraction failed: ${e.message}`);
    }
}

async function setupTarget(key, config) {
    console.log(`\n--- Setting up for ${key} (${config.triple}) ---`);
    const tempDir = path.join(BIN_DIR, `temp_${key}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    try {
        // 1. Setup yt-dlp
        const ytdlpName = `yt-dlp-${config.triple}${config.ext}`;
        const ytdlpPath = path.join(BIN_DIR, ytdlpName);

        if (!fs.existsSync(ytdlpPath)) {
            console.log(`[DOWNLOAD] yt-dlp from ${config.ytdlpUrl}...`);
            await downloadFile(config.ytdlpUrl, ytdlpPath);
            fs.chmodSync(ytdlpPath, 0o755);
            console.log(`[OK] Saved ${ytdlpName}`);
        } else {
            console.log(`[SKIP] ${ytdlpName} exists`);
        }

        // 2. Setup ffmpeg
        const ffmpegName = `ffmpeg-${config.triple}${config.ext}`;
        const ffmpegPath = path.join(BIN_DIR, ffmpegName);

        if (!fs.existsSync(ffmpegPath)) {
            let archiveName = 'ffmpeg_archive';
            if (config.ffmpegUrl.endsWith('.zip')) archiveName += '.zip';
            else if (config.ffmpegUrl.endsWith('.tar.xz')) archiveName += '.tar.xz';

            const archivePath = path.join(tempDir, archiveName);

            console.log(`[DOWNLOAD] ffmpeg archive from ${config.ffmpegUrl}...`);
            await downloadFile(config.ffmpegUrl, archivePath);

            await extractArchive(archivePath, tempDir);

            // Find binary in extracted folders
            // Recursive search for 'ffmpeg' or 'ffmpeg.exe'
            const findFile = (dir, filename) => {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        const found = findFile(fullPath, filename);
                        if (found) return found;
                    } else if (entry.name === filename) {
                        return fullPath;
                    }
                }
                return null;
            };

            const targetBinaryName = config.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
            const foundBinary = findFile(tempDir, targetBinaryName);

            if (foundBinary) {
                fs.copyFileSync(foundBinary, ffmpegPath);
                fs.chmodSync(ffmpegPath, 0o755);
                console.log(`[OK] Saved ${ffmpegName}`);
            } else {
                console.error(`[ERROR] Could not find ${targetBinaryName} in extracted archive for ${key}`);
            }
        } else {
            console.log(`[SKIP] ${ffmpegName} exists`);
        }

    } catch (e) {
        console.error(`[ERROR] Handling ${key}: ${e.message}`);
    } finally {
        // Cleanup temp
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }
    }
}

async function main() {
    console.log('='.repeat(50));
    console.log('SceneClip Binary Setup Manager');
    console.log('='.repeat(50));

    const args = process.argv.slice(2);
    const downloadAll = args.includes('--all');

    // Parse --target flags (e.g., --target win-x64 --target mac-arm64)
    const targetFlags = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--target' && args[i + 1]) {
            targetFlags.push(args[i + 1]);
            i++; // Skip the next arg since we consumed it
        }
    }

    if (downloadAll) {
        console.log('Mode: Download ALL platforms (Windows, macOS, Linux)');
        await setupTarget('win-x64', TARGETS['win-x64']);
        await setupTarget('mac-x64', TARGETS['mac-x64']);
        await setupTarget('mac-arm64', TARGETS['mac-arm64']);
        await setupTarget('linux-x64', TARGETS['linux-x64']);
    } else if (targetFlags.length > 0) {
        console.log(`Mode: Specific targets (${targetFlags.join(', ')})`);
        for (const key of targetFlags) {
            if (TARGETS[key]) {
                await setupTarget(key, TARGETS[key]);
            } else {
                console.error(`[ERROR] Unknown target: ${key}`);
                console.log(`Available targets: ${Object.keys(TARGETS).join(', ')}`);
            }
        }
    } else {
        const currentKey = getCurrentTargetKey();
        if (!currentKey || !TARGETS[currentKey]) {
            console.error(`Current platform ${process.platform}/${process.arch} is not explicitly supported or mapped.`);
            process.exit(1);
        }
        console.log(`Mode: Current Platform Only (${currentKey})`);
        await setupTarget(currentKey, TARGETS[currentKey]);
    }

    console.log('='.repeat(50));
    console.log('Setup Complete!');
}

main();
