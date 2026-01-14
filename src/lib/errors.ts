/**
 * User-friendly error mapper for yt-dlp stderr output
 * Each pattern maps to a clear message and actionable guidance
 */

export const ytdlpErrorMap: Record<string, { message: string; action: string }> = {
    // Authentication / Login Issues
    'Sign in to confirm your age': {
        message: 'Age-restricted video requires login',
        action: 'Enable "Browser Cookies" in Settings → Advanced'
    },
    'members-only': {
        message: 'Members-only content',
        action: 'Login with channel member account via Browser Cookies.'
    },
    'Private video': {
        message: 'Private video',
        action: 'This video is private. You need account access to download it.'
    },
    'Video is private': {
        message: 'Private video',
        action: 'This video is private. You need account access to download it.'
    },

    // Cookie / Browser Access Issues
    'DPAPI': {
        message: 'Cannot access browser cookies',
        action: 'Close your browser completely and try again.'
    },
    'database is locked': {
        message: 'Browser cookie database is locked',
        action: 'Close your browser completely and try again.'
    },
    'could not find a profile': {
        message: 'Browser profile not found',
        action: 'Make sure the selected browser is installed and has been used at least once.'
    },

    // Video Availability Issues
    'Video unavailable': {
        message: 'Video is unavailable',
        action: 'Video may be private, deleted, or region-locked. Try using a VPN.'
    },
    'This video is unavailable': {
        message: 'Video is unavailable',
        action: 'Video may be deleted or region-locked. Try using a VPN.'
    },
    'Premieres in': {
        message: 'Video is a scheduled premiere',
        action: 'This video is not yet available. Check back after the premiere.'
    },
    'This live event will begin': {
        message: 'Live stream not started yet',
        action: 'This is an upcoming live stream. Wait for it to start.'
    },
    'is not a valid URL': {
        message: 'Invalid URL format',
        action: 'Please check the URL and try again.'
    },
    'Unsupported URL': {
        message: 'Unsupported website',
        action: 'This website may not be supported by yt-dlp.'
    },

    // Storage Issues
    'No space left on device': {
        message: 'Disk Full',
        action: 'Free up space on your hard drive and try again.'
    },

    // Rate Limiting / Network Issues
    'HTTP Error 429': {
        message: 'Too many requests (rate limited)',
        action: 'Wait 5-10 minutes before trying again.'
    },
    'HTTP Error 403': {
        message: 'Access forbidden',
        action: 'Video may be region-locked or require login. Try VPN or Browser Cookies.'
    },
    'HTTP Error 404': {
        message: 'Video not found',
        action: 'The video may have been deleted or moved.'
    },
    'HTTP Error 500': {
        message: 'Server error on video site',
        action: 'The video site is having issues. Try again later.'
    },
    'Connection reset': {
        message: 'Connection was reset',
        action: 'Network issue. Check your internet connection and try again.'
    },
    'timed out': {
        message: 'Connection timed out',
        action: 'Network is slow or blocked. Check your connection or try a proxy.'
    },

    // Format / Extraction Issues
    'Unable to extract': {
        message: 'Failed to extract video info',
        action: 'YouTube may have updated. Check for yt-dlp updates in Settings.'
    },
    'No video formats found': {
        message: 'No downloadable formats found',
        action: 'Video may be DRM protected or the site changed. Try updating yt-dlp.'
    },
    'Requested format is not available': {
        message: 'Selected quality not available',
        action: 'Try selecting a different resolution or "Best" quality.'
    },
    'This video is DRM protected': {
        message: 'DRM protected content',
        action: 'This video has copy protection and cannot be downloaded.'
    },

    // Geo-restriction
    'copyright grounds': {
        message: 'Blocked for copyright reasons',
        action: 'This video is blocked in your region due to copyright.'
    },
    'not available in your country': {
        message: 'Region-locked content',
        action: 'This video is not available in your country. Try using a VPN.'
    },
    'geo restriction': {
        message: 'Geographic restriction',
        action: 'This video is geo-blocked. Try using a VPN.'
    }
}

/**
 * Parse yt-dlp stderr and return user-friendly error info
 * @param stderr The stderr output from yt-dlp
 * @returns Object with message and action, or null if no match
 */
export function getHumanReadableError(stderr: string): { message: string; action: string } | null {
    const normalized = stderr.toLowerCase()
    
    for (const [pattern, info] of Object.entries(ytdlpErrorMap)) {
        if (normalized.includes(pattern.toLowerCase())) {
            return info
        }
    }
    
    // Fallback: Try to extract ERROR: message
    const errorMatch = stderr.match(/ERROR:\s*(.+?)(?:\n|$)/i)
    if (errorMatch) {
        return {
            message: errorMatch[1].substring(0, 100),
            action: 'Check the URL and try again. If problem persists, check for yt-dlp updates.'
        }
    }
    
    return null
}
