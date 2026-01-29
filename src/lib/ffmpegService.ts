/**
 * FFmpeg Service
 * 
 * Handles FFmpeg command building, compression, and progress parsing.
 * Extracted from createVideoSlice for better modularity.
 */

import { timeToSeconds } from './processUtils'
import { CompressionOptions } from '../store/slices/types'
import { getFFmpegCommand } from './ytdlp'
import { useAppStore } from '../store'

// =============================================================================
// Types
// =============================================================================

export interface FFmpegProgressEvent {
  currentSeconds: number
  totalSeconds: number
  percent: number
  speed: string
  eta: string
}

export interface CompressionResult {
  success: boolean
  outputPath: string
  fileSize: string
  error?: string
}

// =============================================================================
// FFmpeg Progress Regex
// =============================================================================

/** Regex for FFmpeg time: time=00:00:19.90 or time=19.90 */
export const ffmpegTimeRegex = /time=\s*(\d{2,}:\d{2}:\d{2}\.\d{2}|\d+\.\d+)/

/** Regex for FFmpeg duration: Duration: 00:10:30.00 */
const durationRegex = /Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/

/** Regex for FFmpeg speed: speed=1.5x */
const speedRegex = /speed=\s*([\d.]+)x/

// =============================================================================
// Progress Parsing
// =============================================================================

/**
 * Parse FFmpeg stderr line for progress information
 */
export function parseFFmpegProgress(
  line: string,
  totalDuration: number
): FFmpegProgressEvent | null {
  const timeMatch = line.match(ffmpegTimeRegex)
  if (!timeMatch || totalDuration <= 0) return null

  const currentSeconds = timeToSeconds(timeMatch[1])
  const percent = Math.min(99, Math.round((currentSeconds / totalDuration) * 100))

  const speedMatch = line.match(speedRegex)
  const speed = speedMatch ? `${speedMatch[1]}x` : '-'

  let eta = '-'
  if (speedMatch) {
    const speedVal = parseFloat(speedMatch[1])
    if (speedVal > 0) {
      const remaining = (totalDuration - currentSeconds) / speedVal
      eta = `${Math.floor(remaining)}s`
    }
  }

  return { currentSeconds, totalSeconds: totalDuration, percent, speed, eta }
}

/**
 * Parse FFmpeg duration from stderr
 */
export function parseFFmpegDuration(line: string): number | null {
  const match = line.match(durationRegex)
  return match ? timeToSeconds(match[1]) : null
}

// =============================================================================
// Compression Arguments Builder
// =============================================================================

export interface FileTypeInfo {
  isAudio: boolean
  isImage: boolean
  isVideo: boolean
}

/**
 * Detect file type from path
 */
export function detectFileType(filePath: string): FileTypeInfo {
  const lower = filePath.toLowerCase()
  const isAudio = /\.(mp3|m4a|wav|opus|ogg|flac)$/.test(lower)
  const isImage = /\.(gif|webp|png|jpg|jpeg)$/.test(lower)
  return {
    isAudio,
    isImage,
    isVideo: !isAudio && !isImage
  }
}

/**
 * Build FFmpeg compression arguments based on options and file type
 */
export function buildCompressionArgs(
  inputPath: string,
  outputPath: string,
  options: CompressionOptions,
  fileType: FileTypeInfo
): string[] {
  const args = ['-hide_banner', '-i', inputPath]

  if (fileType.isAudio) {
    // --- Audio Mode ---
    args.push('-vn') // No video
    if (options.audioBitrate) {
      args.push('-b:a', options.audioBitrate)
    }
  } else if (fileType.isImage) {
    // --- Image/GIF Mode ---
    if (options.resolution !== 'original') {
      args.push('-vf', `scale=-2:${options.resolution}`)
    }
  } else {
    // --- Video Mode ---
    switch (options.encoder) {
      case 'nvenc':
        args.push('-c:v', 'h264_nvenc')
        args.push('-cq', String(options.crf))
        args.push('-preset', options.speedPreset === 'veryslow' ? 'p7' : 'p4')
        break
      case 'amf':
        args.push('-c:v', 'h264_amf')
        break
      case 'qsv':
        args.push('-c:v', 'h264_qsv')
        args.push('-global_quality', String(options.crf))
        break
      default: // 'cpu' or 'auto'
        args.push('-c:v', 'libx264')
        args.push('-crf', String(options.crf))
        args.push('-preset', options.speedPreset)
    }

    if (options.resolution !== 'original') {
      args.push('-vf', `scale=-2:${options.resolution}`)
    }

    // Audio handling for video
    if (options.preset === 'archive') {
      args.push('-c:a', 'copy')
    } else {
      args.push('-c:a', 'aac', '-b:a', options.preset === 'wa' ? '96k' : '128k')
    }
  }

  args.push('-y', outputPath) // Overwrite without asking
  return args
}

/**
 * Helper to build output path for compressed file
 */
export function buildCompressedOutputPath(originalPath: string): string {
  const dotIndex = originalPath.lastIndexOf('.')
  const basePath = dotIndex !== -1 ? originalPath.substring(0, dotIndex) : originalPath
  const ext = dotIndex !== -1 ? originalPath.substring(dotIndex) : ''
  return `${basePath}_compress${ext}`
}

// Chapter type for video splitting
export interface VideoChapter {
  title: string
  start_time: number
  end_time: number
}

// -----------------------------------------------------------------------------
// SEQUENTIAL SPLITTING SERVICE
// -----------------------------------------------------------------------------
export async function splitVideoByChapters(
  fullFilePath: string,
  chapters: VideoChapter[],
  onProgress: (percent: number) => void
) {
  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) return

  // Create output directory based on filename
  // e.g. "C:/Downloads/MyVideo.mp4" -> "C:/Downloads/MyVideo_Chapters/"
  const lastDot = fullFilePath.lastIndexOf('.')
  const baseName = fullFilePath.substring(0, lastDot)
  const ext = fullFilePath.substring(lastDot) // .mp4

  // We can't easily create directories in frontend-side logic without `fs` plugin quirks.
  // Instead, we will pattern match the output filename directly.
  // Actually, let's just suffix them in the same folder to be safe: "MyVideo - Chapter 1.mp4"

  // We need accurate total duration to calculate progress
  const totalDuration = Math.max(1, chapters[chapters.length - 1].end_time - chapters[0].start_time)
  let accumulatedTime = 0

  for (const [index, chapter] of chapters.entries()) {
    const safeTitle = chapter.title.replace(/[\\/:*?"<>|]/g, '_').trim()
    const outputName = `${baseName} - ${String(index + 1).padStart(2, '0')} - ${safeTitle}${ext}`

    // Command: ffmpeg -i info.mp4 -ss start -to end -c copy output.mp4
    // -y to overwrite
    const args = [
      '-hide_banner',
      '-i', fullFilePath,
      '-ss', String(chapter.start_time),
      '-to', String(chapter.end_time),
      '-c', 'copy',
      '-map_metadata', '0', // Keep metadata
      '-y',
      outputName
    ]

    try {
      const settings = useAppStore.getState().settings
      const cmd = await getFFmpegCommand(args, settings.binaryPathFfmpeg)

      // Wait for completion (promisified)
      await new Promise<void>((resolve, reject) => {
        cmd.on('close', (data) => {
          if (data.code === 0) resolve()
          else reject(new Error(`FFmpeg exited with ${data.code}`))
        })
        cmd.on('error', reject)

        cmd.spawn().then(() => { }).catch(reject)
      })

      // Update Progress
      const chapterDuration = chapter.end_time - chapter.start_time
      accumulatedTime += chapterDuration
      const percent = (accumulatedTime / totalDuration) * 100
      onProgress(percent)

    } catch (e) {
      console.error(`Failed to split chapter ${index + 1}:`, e)
      // Continue to next chapter even if one fails
    }
  }
}
