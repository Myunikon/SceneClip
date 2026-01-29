import { invoke } from '@tauri-apps/api/core';
import { getHostname, parse } from 'tldts';

// Constants
export const VIDEO_URL_REGEX = /^https?:\/\/[\w.-]+\.[\w.-]+/i
export const MAX_URL_LENGTH = 2000

/**
 * Validates a potential video URL (Frontend Regex Pre-check)
 * Use validateUrlBackend for robust checking.
 */
export function isValidVideoUrl(text: string): boolean {
    if (!text || text.length > MAX_URL_LENGTH) return false
    return VIDEO_URL_REGEX.test(text.trim())
}

/**
 * Validates URL using Rust backend (Strict & Consistent)
 */
export async function validateUrlBackend(url: string): Promise<boolean> {
    try {
        return await invoke('validate_url', { url });
    } catch (e) {
        console.error("Backend validation failed", e);
        return false;
    }
}

/**
 * Extracts a clean hostname from a URL.
 */
export function extractHostname(url: string): string {
    return getHostname(url) || url.toLowerCase().trim();
}

/**
 * Matches a URL against a saved domain pattern using Strict Scoped Matching.
 * 
 * Rules:
 * 1. Exact Match: 'sub.example.com' matches 'sub.example.com'.
 * 2. Downward Scoping: 
 *    - If saved as 'example.com' (Registered Domain), matches 'any.sub.example.com'.
 *    - If saved as 'api.example.com' (Specific Subdomain), matches 'v1.api.example.com' 
 *      but NEVER matches sibling 'blog.example.com'.
 * 3. Public Suffix Protection: 'com' or 'co.uk' matches NOTHING.
 * 4. Normalization: Standardizes hostnames to prevent Punycode/case spoofing.
 */
export function matchDomain(url: string, savedDomain: string): boolean {
    if (!url || !savedDomain) return false;

    const urlParse = parse(url, { allowPrivateDomains: true });
    const savedParse = parse(savedDomain, { allowPrivateDomains: true });

    if (!urlParse.hostname || !savedParse.hostname) return false;

    // Safety: Never match a Public Suffix (e.g. 'com', 'co.uk')
    if (!savedParse.domainWithoutSuffix) return false;

    const urlHostname = urlParse.hostname;
    const savedHostname = savedParse.hostname;

    // 1. Strict Identity Match
    if (urlHostname === savedHostname) return true;

    // 2. Scoped Matching
    // If the saved domain is just the base Registered Domain (e.g. 'google.com')
    if (savedHostname === savedParse.domain) {
        return urlHostname.endsWith(`.${savedHostname}`);
    }

    // If the saved domain is a specific subdomain (e.g. 'api.example.com')
    // We only match children of this specific subdomain.
    return urlHostname.endsWith(`.${savedHostname}`);
}

export function isYouTubeUrl(url: string): boolean {
    if (!url) return false
    try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname.replace('www.', '')
        return (
            hostname === 'youtube.com' ||
            hostname === 'youtu.be' ||
            hostname === 'm.youtube.com' ||
            hostname.endsWith('.youtube.com')
        )
    } catch {
        // Fallback for partial URLs if needed, or return false
        return /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url)
    }
}
