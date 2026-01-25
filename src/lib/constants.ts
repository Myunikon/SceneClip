
export const BINARIES = {
    FFMPEG: 'ffmpeg',
    YTDLP: 'yt-dlp',
    FFPROBE: 'ffprobe'
}

export const DEFAULTS = {
    SOCKET_TIMEOUT: '15'
}

export const VIDEO_EXTS = ['mp4', 'mkv', 'webm', 'mov', 'avi']
export const AUDIO_EXTS = ['mp3', 'm4a', 'wav', 'flac', 'opus', 'ogg']
export const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp']

export const ALL_SUPPORTED_EXTS = [...VIDEO_EXTS, ...AUDIO_EXTS, ...IMAGE_EXTS]
