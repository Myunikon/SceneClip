import { join } from "@tauri-apps/api/path";
import {
  mkdir,
  exists,
  writeFile,
  remove,
  readFile,
} from "@tauri-apps/plugin-fs";
import JSZip from "jszip";
import { getPlatformInfo } from "./platform";

// NOTE: TRUSTED_HASHES removed to prevent false "corrupted" alerts
// When binaries are updated to newer versions, old hardcoded hashes
// would cause valid binaries to be flagged as corrupted.
// 
// Integrity verification now happens ONLY during download:
// - yt-dlp: Checksum fetched dynamically from GitHub SHA2-256SUMS
// - FFmpeg: Checksum passed from updater-service when available
//
// Post-install validation uses BEHAVIORAL checks (can binary run?)
// instead of hash comparison.

export const verifyChecksum = async (data: Uint8Array, expectedHash: string) => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex === expectedHash;
};

export type BinaryInstallCallback = (
  status: string,
  progress: number,
  speed?: string,
  eta?: string
) => void;

export async function installFFmpeg(
  url: string,
  onProgress: BinaryInstallCallback | BinaryInstallCallbackV2,
  signal: AbortSignal,
  _force: boolean = false,  // Unused - chunked download handles resume automatically
  expectedChecksum?: string,
  isPaused?: () => boolean  // New: function to check if pause was requested
): Promise<{ completed: boolean }> {
  const { isWindows, isLinux } = getPlatformInfo();
  // STRICT PATH: C:\Users\ACER ID\AppData\Roaming\clipscene\binaries
  const ffmpegBinDir = "C:\\Users\\ACER ID\\AppData\\Roaming\\clipscene\\binaries";

  // Ensure dir exists
  if (!(await exists(ffmpegBinDir))) {
    await mkdir(ffmpegBinDir, { recursive: true });
  }

  // Platform-specific binary names
  const ffmpegName = isWindows ? "ffmpeg.exe" : "ffmpeg";
  const ffprobeName = isWindows ? "ffprobe.exe" : "ffprobe";
  const ffmpegPath = await join(ffmpegBinDir, ffmpegName);
  
  // Linux uses .tar.xz which we can't handle in browser JS easily
  // For now, Linux users should install ffmpeg via package manager
  if (isLinux) {
    onProgress("Linux: Please install FFmpeg via package manager (apt install ffmpeg)", 100);
    console.warn("FFmpeg auto-install not supported on Linux. Please install manually: sudo apt install ffmpeg");
    // Return false so UI doesn't incorrectly mark as "Ready"
    // User needs to install manually
    return { completed: false };
  }

  const zipPath = await join(ffmpegBinDir, "ffmpeg.zip");

  // Use chunked download for pause/resume support
  const { downloadFileChunked } = await import("./chunked-download");

  onProgress("Downloading FFmpeg...", 0, "-", "Starting...");

  const result = await downloadFileChunked(url, zipPath, {
    chunkSize: 1024 * 1024, // 1MB chunks for FFmpeg (larger file)
    onProgress: ({ loaded, total, speed, canPause }) => {
      if (signal.aborted) return;
      
      const speedMB = (speed / 1024 / 1024).toFixed(1);
      const loadedMB = (loaded / 1024 / 1024).toFixed(1);
      const totalMB = total > 0 ? (total / 1024 / 1024).toFixed(1) : "?";
      const progress = total > 0 ? (loaded / total) * 100 : 0;

      let eta = "Unknown";
      if (speed > 0 && total > loaded) {
        const remainingBytes = total - loaded;
        const sec = Math.ceil(remainingBytes / speed);
        eta = sec > 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`;
      }

      // Call with optional canPause parameter
      (onProgress as BinaryInstallCallbackV2)(
        `Downloading FFmpeg... ${loadedMB} / ${totalMB} MB`,
        total > 0 ? progress : loaded % 100,
        `${speedMB} MB/s`,
        eta,
        canPause
      );
    },
    isPaused: isPaused || (() => false)
  });

  // If paused mid-download, return early
  if (!result.completed) {
    console.log('[FFmpeg] Download paused at', result.resumePosition, 'bytes');
    return { completed: false };
  }

  // Read the downloaded zip for extraction
  const arrayBuffer = await readFile(zipPath);

  // Check Integrity - only if checksum was provided (e.g., from GitHub release)
  if (expectedChecksum) {
    onProgress("Verifying Integrity...", 100);
    const isValid = await verifyChecksum(arrayBuffer, expectedChecksum);
    if (!isValid) {
      await remove(zipPath);
      throw new Error(
        "Security Alert: FFmpeg Checksum Mismatch! (Deleted corrupt file)"
      );
    }
  }

  onProgress("Extracting FFmpeg...", 100);

  const zip = new JSZip();
  const contents = await zip.loadAsync(arrayBuffer);

  let ffmpegData: Uint8Array | null = null;
  let ffprobeData: Uint8Array | null = null;

  for (const [relativePath, file] of Object.entries(contents.files)) {
    // Windows: bin/ffmpeg.exe, macOS: ffmpeg (in root or bin folder)
    if (relativePath.endsWith("bin/ffmpeg.exe") || relativePath.endsWith("bin/ffmpeg") || relativePath === "ffmpeg") {
      ffmpegData = await file.async("uint8array");
    }
    if (relativePath.endsWith("bin/ffprobe.exe") || relativePath.endsWith("bin/ffprobe") || relativePath === "ffprobe") {
      ffprobeData = await file.async("uint8array");
    }
  }

  if (!ffmpegData)
    throw new Error("Could not find ffmpeg binary in downloaded zip");

  await writeFile(ffmpegPath, ffmpegData);
  if (ffprobeData)
    await writeFile(await join(ffmpegBinDir, ffprobeName), ffprobeData);

  // Set executable permission on Unix
  if (!isWindows) {
    const { Command } = await import("@tauri-apps/plugin-shell");
    await Command.create("chmod", ["+x", ffmpegPath]).execute();
    if (ffprobeData) {
      await Command.create("chmod", ["+x", await join(ffmpegBinDir, ffprobeName)]).execute();
    }
  }

  // Clean up zip
  await remove(zipPath);
  
  return { completed: true };
}

export type BinaryInstallCallbackV2 = (
  status: string,
  progress: number,
  speed?: string,
  eta?: string,
  canPause?: boolean
) => void;

export async function installYtDlp(
  url: string,
  onProgress: BinaryInstallCallback | BinaryInstallCallbackV2,
  signal: AbortSignal,
  _force: boolean = false,  // Unused - chunked download handles resume automatically
  expectedChecksum?: string,
  isPaused?: () => boolean  // New: function to check if pause was requested
): Promise<{ completed: boolean }> {
  // STRICT PATH requested:
  const binDir = "C:\\Users\\ACER ID\\AppData\\Roaming\\clipscene\\binaries";

  // Ensure dir exists
  if (!(await exists(binDir))) {
    await mkdir(binDir, { recursive: true });
  }

  const { isWindows: isWin } = getPlatformInfo();
  const ytdlpExe = isWin ? "yt-dlp.exe" : "yt-dlp";
  const ytdlpPath = await join(binDir, ytdlpExe);

  // Use chunked download for pause/resume support
  const { downloadFileChunked } = await import("./chunked-download");

  onProgress("Downloading yt-dlp...", 0, "-", "Starting...");

  const result = await downloadFileChunked(url, ytdlpPath, {
    chunkSize: 512 * 1024, // 512KB chunks for more responsive pause
    onProgress: ({ loaded, total, speed, canPause }) => {
      if (signal.aborted) return;
      
      const speedMB = (speed / 1024 / 1024).toFixed(1);
      const loadedMB = (loaded / 1024 / 1024).toFixed(1);
      const totalMB = total > 0 ? (total / 1024 / 1024).toFixed(1) : "?";
      const progress = total > 0 ? (loaded / total) * 100 : 0;

      let eta = "Unknown";
      if (speed > 0 && total > loaded) {
        const remainingBytes = total - loaded;
        const sec = Math.ceil(remainingBytes / speed);
        eta = sec > 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`;
      }

      // Call with optional canPause parameter
      (onProgress as BinaryInstallCallbackV2)(
        `Downloading yt-dlp... ${loadedMB} / ${totalMB} MB`,
        total > 0 ? progress : loaded % 100,
        `${speedMB} MB/s`,
        eta,
        canPause
      );
    },
    isPaused: isPaused || (() => false)
  });

  // If paused mid-download, return early
  if (!result.completed) {
    console.log('[yt-dlp] Download paused at', result.resumePosition, 'bytes');
    return { completed: false };
  }

  // Verify checksum only if provided (e.g., from GitHub release)
  if (expectedChecksum) {
    onProgress("Verifying Checksum...", 100);
    const data = await readFile(ytdlpPath);
    const isValid = await verifyChecksum(data, expectedChecksum);
    if (!isValid) {
      await remove(ytdlpPath);
      throw new Error(
        `Security Alert: yt-dlp Checksum Mismatch! Expected: ${expectedChecksum}`
      );
    }
  } else {
    console.log("Skipping checksum verification (no hash provided)");
  }

  if (!isWin) {
    const { Command } = await import("@tauri-apps/plugin-shell");
    await Command.create("chmod", ["+x", ytdlpPath]).execute();
  }

  return { completed: true };
}
