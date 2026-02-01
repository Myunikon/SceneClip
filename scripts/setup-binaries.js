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
const BIN_DIR = path.resolve(__dirname, '../src-tauri/bin');

if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
}

// Configuration for all supported targets
const TARGETS = {
    'win-x64': {
        triple: 'x86_64-pc-windows-msvc',
        platform: 'win32',
        arch: 'x64',
        ffmpegUrl: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
        denoUrl: 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip',
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
        aria2Url: 'https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-64bit-build1.zip',
        rsgainUrl: 'https://github.com/complexlogic/rsgain/releases/download/v3.6/rsgain_3.6_win64.zip',
        ext: '.exe'
    },
    'win-arm64': {
        triple: 'aarch64-pc-windows-msvc',
        platform: 'win32',
        arch: 'arm64',
        ffmpegUrl: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-winarm64-gpl.zip',
        denoUrl: 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip', // x64 via emulation
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_arm64.exe',
        aria2Url: 'https://github.com/minnyres/aria2-windows-arm64/releases/download/1.37.0/aria2_1.37.0_arm64.zip',
        rsgainUrl: 'https://github.com/complexlogic/rsgain/releases/download/v3.6/rsgain_3.6_win64.zip', // Emulated x64
        ext: '.exe'
    },
    'win-x86': {
        triple: 'i686-pc-windows-msvc',
        platform: 'win32',
        arch: 'x86',
        ffmpegUrl: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win32-gpl.zip',
        denoUrl: 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip', // Fallback to x64 if 32bit omitted
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_x86.exe',
        aria2Url: 'https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-win-32bit-build1.zip',
        rsgainUrl: null, // No 32-bit binary available
        ext: '.exe'
    },
    'mac-x64': {
        triple: 'x86_64-apple-darwin',
        platform: 'darwin',
        arch: 'x64',
        ffmpegUrl: 'https://evermeet.cx/ffmpeg/getrelease/zip',
        denoUrl: 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-apple-darwin.zip',
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
        // Official Mac build (Intel). Runs via Rosetta on ARM.
        aria2Url: 'https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-osx-darwin.tar.bz2',
        rsgainUrl: 'https://github.com/complexlogic/rsgain/releases/download/v3.6/rsgain_3.6_macos-x64.zip',
        ext: ''
    },
    'mac-arm64': {
        triple: 'aarch64-apple-darwin',
        platform: 'darwin',
        arch: 'arm64',
        // Strategy: Use x64 build via Rosetta 2 (Standard practice for broad compat)
        ffmpegUrl: 'https://evermeet.cx/ffmpeg/getrelease/zip',
        denoUrl: 'https://github.com/denoland/deno/releases/latest/download/deno-aarch64-apple-darwin.zip',
        // Strategy: Use Universal Binary (Native support for both)
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
        // Use Intel build via Rosetta
        aria2Url: 'https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-osx-darwin.tar.bz2',
        rsgainUrl: 'https://github.com/complexlogic/rsgain/releases/download/v3.6/rsgain_3.6_macos-arm64.zip',
        ext: ''
    },
    'linux-x64': {
        triple: 'x86_64-unknown-linux-gnu',
        platform: 'linux',
        arch: 'x64',
        ffmpegUrl: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
        denoUrl: 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip',
        ytdlpUrl: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
        aria2Url: 'https://github.com/aria2/aria2/releases/download/release-1.36.0/aria2-1.36.0-linux-gnu-64bit-build1.tar.bz2',
        rsgainUrl: null, // No static binary available for Linux. Use package manager.
        ext: ''
    }
};

// Helper: Get Current Target Key
const getCurrentTargetKey = () => {
    const p = process.platform;
    const a = process.arch;
    if (p === 'win32') return a === 'arm64' ? 'win-arm64' : 'win-x64';
    if (p === 'linux') return 'linux-x64';
    if (p === 'darwin') return a === 'arm64' ? 'mac-arm64' : 'mac-x64';
    return null;
};

// Helper: Download File with redirect support (handles both absolute and relative redirects)
const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const makeRequest = (currentUrl) => {
            const parsedUrl = new URL(currentUrl);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;

            protocol.get(currentUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SceneClip/1.0)' }
            }, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Handle both absolute and relative redirects
                    const location = response.headers.location;
                    const redirectUrl = location.startsWith('http')
                        ? location
                        : new URL(location, currentUrl).href;
                    makeRequest(redirectUrl);
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

// Helper: Recursive search for a filename in a directory
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
        } else if (filePath.endsWith('.tar.bz2')) {
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
            // Handle both .zip extension and URLs ending with /zip (like evermeet.cx)
            if (config.ffmpegUrl.endsWith('.zip') || config.ffmpegUrl.endsWith('/zip')) {
                archiveName += '.zip';
            } else if (config.ffmpegUrl.endsWith('.tar.xz')) {
                archiveName += '.tar.xz';
            }

            const archivePath = path.join(tempDir, archiveName);

            console.log(`[DOWNLOAD] ffmpeg archive from ${config.ffmpegUrl}...`);
            await downloadFile(config.ffmpegUrl, archivePath);

            await extractArchive(archivePath, tempDir);

            // 2. Setup ffmpeg & ffprobe

            const targetBinaryName = config.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
            const foundBinary = findFile(tempDir, targetBinaryName);

            if (foundBinary) {
                fs.copyFileSync(foundBinary, ffmpegPath);
                fs.chmodSync(ffmpegPath, 0o755);
                console.log(`[OK] Saved ${ffmpegName}`);

                // Also try to find ffprobe in the same archive
                const ffprobeName = `ffprobe-${config.triple}${config.ext}`;
                const ffprobePath = path.join(BIN_DIR, ffprobeName);
                if (!fs.existsSync(ffprobePath)) {
                    const targetProbeName = config.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
                    const foundProbe = findFile(tempDir, targetProbeName);
                    if (foundProbe) {
                        fs.copyFileSync(foundProbe, ffprobePath);
                        fs.chmodSync(ffprobePath, 0o755);
                        console.log(`[OK] Saved ${ffprobeName}`);
                    }
                }
            } else {
                console.error(`[ERROR] Could not find ${targetBinaryName} in extracted archive for ${key}`);
            }
        } else {
            console.log(`[SKIP] ${ffmpegName} exists`);
        }

        // 2.1 Setup ffprobe (Independent check)
        const ffprobeName = `ffprobe-${config.triple}${config.ext}`;
        const ffprobePath = path.join(BIN_DIR, ffprobeName);
        if (!fs.existsSync(ffprobePath)) {
            console.log(`[RE-EXTRACT] ${ffprobeName} from ffmpeg archive...`);
            // We need the archive again... let's just download it if missing or use same logic
            // To keep it simple, if ffmpeg exists but ffprobe doesn't, we'll try to re-download/extract
            // This is a rare edge case, but good for completeness.
            let archiveName = 'ffmpeg_archive';
            if (config.ffmpegUrl.endsWith('.zip') || config.ffmpegUrl.endsWith('/zip')) archiveName += '.zip';
            else if (config.ffmpegUrl.endsWith('.tar.xz')) archiveName += '.tar.xz';

            const archivePath = path.join(tempDir, archiveName);
            await downloadFile(config.ffmpegUrl, archivePath);
            await extractArchive(archivePath, tempDir);

            const targetProbeName = config.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
            const foundProbe = findFile(tempDir, targetProbeName);
            if (foundProbe) {
                fs.copyFileSync(foundProbe, ffprobePath);
                fs.chmodSync(ffprobePath, 0o755);
                console.log(`[OK] Saved ${ffprobeName}`);
            }
        } else {
            console.log(`[SKIP] ${ffprobeName} exists`);
        }

        // 3. Setup Aria2c
        const aria2Name = `aria2c-${config.triple}${config.ext}`;
        const aria2Path = path.join(BIN_DIR, aria2Name);

        if (!fs.existsSync(aria2Path)) {
            let archiveName = 'aria2_archive';
            if (config.aria2Url.endsWith('.zip')) archiveName += '.zip';
            else if (config.aria2Url.endsWith('.tar.bz2')) archiveName += '.tar.bz2';

            const archivePath = path.join(tempDir, archiveName);
            console.log(`[DOWNLOAD] aria2c from ${config.aria2Url}...`);
            await downloadFile(config.aria2Url, archivePath);
            await extractArchive(archivePath, tempDir);

            // 3. Setup Aria2c

            const targetBinaryName = config.platform === 'win32' ? 'aria2c.exe' : 'aria2c';
            const foundBinary = findFile(tempDir, targetBinaryName);

            if (foundBinary) {
                fs.copyFileSync(foundBinary, aria2Path);
                fs.chmodSync(aria2Path, 0o755);
                console.log(`[OK] Saved ${aria2Name}`);
            } else {
                console.error(`[ERROR] Could not find ${targetBinaryName} in extracted archive for ${key}`);
            }
        } else {
            console.log(`[SKIP] ${aria2Name} exists`);
        }

        // 4. Setup rsgain (ReplayGain)
        if (config.rsgainUrl) {
            const rsgainName = `rsgain-${config.triple}${config.ext}`;
            const rsgainPath = path.join(BIN_DIR, rsgainName);

            if (!fs.existsSync(rsgainPath)) {
                let archiveName = 'rsgain_archive';
                if (config.rsgainUrl.endsWith('.zip')) archiveName += '.zip';

                const archivePath = path.join(tempDir, archiveName);
                console.log(`[DOWNLOAD] rsgain from ${config.rsgainUrl}...`);
                await downloadFile(config.rsgainUrl, archivePath);
                await extractArchive(archivePath, tempDir);

                // 4. Setup rsgain

                const targetBinaryName = config.platform === 'win32' ? 'rsgain.exe' : 'rsgain';
                const foundBinary = findFile(tempDir, targetBinaryName);

                if (foundBinary) {
                    fs.copyFileSync(foundBinary, rsgainPath);
                    fs.chmodSync(rsgainPath, 0o755);
                    console.log(`[OK] Saved ${rsgainName}`);
                } else {
                    console.error(`[ERROR] Could not find ${targetBinaryName} in extracted archive for ${key}`);
                }
            } else {
                console.log(`[SKIP] ${rsgainName} exists`);
            }
        } else if (config.platform === 'linux') {
            console.log('[INFO] Skipping rsgain (No static binary for Linux). Please install via package manager (apt install rsgain or equivalent).');
        }

        // 5. Setup Deno
        if (config.denoUrl) {
            const denoName = `deno-${config.triple}${config.ext}`;
            const denoPath = path.join(BIN_DIR, denoName);

            if (!fs.existsSync(denoPath)) {
                const archivePath = path.join(tempDir, 'deno_archive.zip');
                console.log(`[DOWNLOAD] deno from ${config.denoUrl}...`);
                await downloadFile(config.denoUrl, archivePath);
                await extractArchive(archivePath, tempDir);

                const targetBinaryName = config.platform === 'win32' ? 'deno.exe' : 'deno';
                const foundBinary = findFile(tempDir, targetBinaryName);

                if (foundBinary) {
                    fs.copyFileSync(foundBinary, denoPath);
                    fs.chmodSync(denoPath, 0o755);
                    console.log(`[OK] Saved ${denoName}`);
                } else {
                    console.error(`[ERROR] Could not find ${targetBinaryName} in extracted archive for ${key}`);
                }
            } else {
                console.log(`[SKIP] ${denoName} exists`);
            }
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
        await setupTarget('win-x86', TARGETS['win-x86']);
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
