import { invoke } from '@tauri-apps/api/core'
import { CompressionOptions } from '../store/slices/types'
import { useAppStore } from '../store'

// =============================================================================
// Types
// =============================================================================

export interface FFmpegProgressEvent {
  percent: number
  speed: string
  eta: string
}

export interface VideoChapter {
  title: string
  start_time: number
  end_time: number
}

// =============================================================================
// Utilities (Exported)
// =============================================================================

export function detectFileType(filePath: string): 'video' | 'audio' | 'image' | 'unknown' {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  if (['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv'].includes(ext)) return 'video'
  if (['mp3', 'm4a', 'wav', 'flac', 'aac', 'ogg', 'opus'].includes(ext)) return 'audio'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image'
  return 'unknown'
}

export function buildCompressedOutputPath(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.')
  if (lastDot === -1) return `${filePath}_compressed.mp4`
  return `${filePath.substring(0, lastDot)}_compressed.mp4` // Default to mp4 for compressed video
}

export function parseFFmpegDuration(stderr: string): number {
  // Duration: 00:00:30.50
  const match = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/)
  if (match) {
    const hours = parseFloat(match[1])
    const minutes = parseFloat(match[2])
    const seconds = parseFloat(match[3])
    return (hours * 3600) + (minutes * 60) + seconds
  }
  return 0
}

export function parseFFmpegProgress(stderr: string, totalDuration: number): FFmpegProgressEvent | null {
  // frame=  123 fps= 25 q=28.0 size=    1024kB time=00:00:05.12 bitrate=1638.4kbits/s speed=1.23x
  const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/)
  const speedMatch = stderr.match(/speed=\s*(\d+(\.\d+)?)x/)

  if (timeMatch && totalDuration > 0) {
    const hours = parseFloat(timeMatch[1])
    const minutes = parseFloat(timeMatch[2])
    const seconds = parseFloat(timeMatch[3])
    const current = (hours * 3600) + (minutes * 60) + seconds

    let percent = (current / totalDuration) * 100
    if (percent > 100) percent = 100

    const speedVal = speedMatch ? parseFloat(speedMatch[1]) : 1
    const remaining = (totalDuration - current) / (speedVal > 0 ? speedVal : 1)

    return {
      percent: parseFloat(percent.toFixed(1)),
      speed: speedMatch ? `${speedMatch[1]}x` : '1x',
      eta: `${remaining.toFixed(0)}s`
    }
  }
  return null
}

export function buildCompressionArgs(
  inputPath: string,
  outputPath: string,
  options: CompressionOptions,
  fileType: 'video' | 'audio' | 'image' | 'unknown'
): string[] {
  const args = ['-i', inputPath]

  if (fileType === 'video') {
    // Video Encoding Logic
    // Apply options.resolution if not original
    if (options.resolution !== 'Original') {
      const h = options.resolution.replace('p', '')
      args.push('-vf', `scale=-2:${h}`)
    }

    // Encoder logic
    const encMap: any = {
      'auto': 'libx264',
      'cpu': 'libx264',
      'nvenc': 'h264_nvenc',
      'amf': 'h264_amf',
      'qsv': 'h264_qsv'
    }
    const encoder = encMap[options.encoder] || 'libx264'
    args.push('-c:v', encoder)

    // Preset/CRF
    if (encoder === 'libx264') {
      args.push('-preset', options.speedPreset || 'medium')
      args.push('-crf', String(options.crf))
    } else {
      // HW Accel args often differ, keeping simple for now
      args.push('-cq', String(options.crf))
    }

    args.push('-c:a', 'aac', '-b:a', '128k') // Basic audio
  }

  args.push(outputPath)
  return args
}

// =============================================================================
// Rust Service Integration
// =============================================================================

/**
 * Compresses media using the Rust backend.
 * Streams progress events via the provided callback.
 */
export async function compressMedia(
  inputPath: string,
  outputPath: string,
  options: CompressionOptions,
  onProgress: (event: FFmpegProgressEvent) => void
): Promise<void> {
  const settings = useAppStore.getState().settings;
  // Simple heuristic for audio/image vs video
  const lower = inputPath.toLowerCase();
  const isAudio = /\.(mp3|m4a|wav|opus|ogg|flac)$/.test(lower);
  const isImage = /\.(gif|webp|png|jpg|jpeg)$/.test(lower);

  try {
    const channel = new Channel<any>();
    channel.onmessage = (msg) => {
      const event = msg.event; // 'Progress', 'Log', 'Completed', 'Error'
      const data = msg.data;

      if (event === 'Progress') {
        onProgress({
          percent: data.percent,
          speed: data.speed,
          eta: data.eta
        });
      } else if (event === 'Error') {
        throw new Error(data.message);
      }
    };

    await invoke('compress_media', {
      app: undefined, // Backend handles app handle
      inputPath,
      outputPath,
      options,
      isAudio,
      isImage,
      settings,
      onEvent: channel
    });
  } catch (e) {
    console.error("Rust Compression Failed:", e);
    throw e;
  }
}

/**
 * Splits video by chapters using the Rust backend.
 */
export async function splitVideoByChapters(
  fullFilePath: string,
  chapters: VideoChapter[],
  onProgress: (percent: number) => void
): Promise<void> {
  const settings = useAppStore.getState().settings;

  // Use Tauri Channel for progress
  const channel = new Channel<any>();
  channel.onmessage = (msg) => {
    if (msg.event === 'Progress') {
      onProgress(msg.data.percent);
    }
  };

  try {
    await invoke('split_media_chapters', {
      inputPath: fullFilePath,
      chapters,
      settings,
      onEvent: channel
    });
  } catch (e) {
    console.error("Rust Split Failed:", e);
    throw e;
  }
}

// Helper types for Channel (if not globally available)
class Channel<T> {
  id: number;
  onmessage: (response: T) => void = () => { };
  constructor() {
    this.id = Math.floor(Math.random() * 1000000);
    // @ts-ignore - Internal Tauri API binding
    window[`_${this.id}`] = (response: any) => {
      this.onmessage(response);
    };
  }
  toJSON() {
    return `__CHANNEL__:${this.id}`;
  }
}
