import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN_DIR = path.resolve(__dirname, '../src-tauri/binaries');

if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
}

// Map Node platform/arch to Rust/Tauri target triples
const getTargetTriple = () => {
    const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
    const platform = process.platform;
    
    if (platform === 'win32') return `${arch}-pc-windows-msvc`;
    if (platform === 'darwin') return `${arch}-apple-darwin`;
    if (platform === 'linux') return `${arch}-unknown-linux-gnu`;
    
    throw new Error(`Unknown platform: ${platform}`);
};

const TARGET_TRIPLE = getTargetTriple();
console.log(`[SETUP] Target Triple: ${TARGET_TRIPLE}`);

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(dest));
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

async function main() {
    // --- 1. YT-DLP ---
    const ytdlpName = process.platform === 'win32' ? `yt-dlp-${TARGET_TRIPLE}.exe` : `yt-dlp-${TARGET_TRIPLE}`;
    const ytdlpPath = path.join(BIN_DIR, ytdlpName);

    // Only download if missing or forced (in CI we assume clean state usually)
    if (!fs.existsSync(ytdlpPath)) {
        let ytdlpUrl = '';
        if (process.platform === 'linux') ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
        else if (process.platform === 'darwin') ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
        else if (process.platform === 'win32') ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

        console.log(`[DOWNLOAD] yt-dlp from perma-link...`);
        await downloadFile(ytdlpUrl, ytdlpPath);
        fs.chmodSync(ytdlpPath, 0o755);
        console.log(`[OK] Saved yt-dlp to ${ytdlpName}`);
    } else {
        console.log(`[SKIP] yt-dlp already exists: ${ytdlpName}`);
    }

    // --- 2. FFMPEG ---
    // Strategy: Assume ffmpeg is installed in system PATH (actions/setup-ffmpeg or apt-get).
    // Find it and copy it to binaries/ffmpeg-<triple>
    
    const ffmpegTargetName = process.platform === 'win32' ? `ffmpeg-${TARGET_TRIPLE}.exe` : `ffmpeg-${TARGET_TRIPLE}`;
    const ffmpegDestPath = path.join(BIN_DIR, ffmpegTargetName);

    if (!fs.existsSync(ffmpegDestPath)) {
        try {
            console.log(`[SEARCH] Looking for 'ffmpeg' in PATH...`);
            const whichCmd = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
            const systemFfmpegPath = execSync(whichCmd).toString().trim().split('\n')[0].replace(/\r$/, '');
            
            if (systemFfmpegPath && fs.existsSync(systemFfmpegPath)) {
                console.log(`[COPY] Found system ffmpeg at ${systemFfmpegPath}. Copying to binaries...`);
                fs.copyFileSync(systemFfmpegPath, ffmpegDestPath);
                fs.chmodSync(ffmpegDestPath, 0o755);
                console.log(`[OK] ffmpeg setup complete.`);
            } else {
                console.warn(`[WARN] Could not find ffmpeg in PATH. Build might fail if sidecar is missing.`);
            }
        } catch (e) {
            console.warn(`[WARN] Failed to resolve system ffmpeg: ${e.message}`);
        }
    } else {
        console.log(`[SKIP] ffmpeg already exists: ${ffmpegTargetName}`);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
