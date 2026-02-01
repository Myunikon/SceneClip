import { invoke, Channel } from '@tauri-apps/api/core'
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

export type FFmpegBackendEvent =
  | { event: 'progress'; data: { percent: number; speed: string; eta: string } }
  | { event: 'log'; data: { message: string; level: string } }
  | { event: 'completed'; data: { outputPath: string } }
  | { event: 'error'; data: { message: string } };

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
  const lower = inputPath.toLowerCase();
  const isAudio = /\.(mp3|m4a|wav|opus|ogg|flac)$/.test(lower);
  const isImage = /\.(gif|webp|png|jpg|jpeg)$/.test(lower);

  const channel = new Channel<FFmpegBackendEvent>();
  channel.onmessage = (msg) => {
    const { event, data } = msg;

    if (event === 'progress') {
      onProgress({
        percent: data.percent,
        speed: data.speed,
        eta: data.eta
      });
    } else if (event === 'error') {
      console.error("FFmpeg Rust Error:", data.message);
    }
  };

  try {
    await invoke('compress_media', {
      inputPath,
      outputPath,
      options,
      isAudio,
      isImage,
      settings,
      onEvent: channel
    });
  } catch (e) {
    console.error("Rust Compression Invoke Failed:", e);
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

  const channel = new Channel<FFmpegBackendEvent>();
  channel.onmessage = (msg) => {
    if (msg.event === 'progress') {
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

/**
 * @deprecated Use Rust version (compress_media or split_media_chapters) instead.
 */
export async function getFFmpegCommand(args: string[], _customBinaryPath?: string) {
  const { Command } = await import('@tauri-apps/plugin-shell')
  return Command.create('ffmpeg', args)
}
