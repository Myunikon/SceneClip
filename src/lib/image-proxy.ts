
/**
 * Proxies image URLs through a public proxy (images.weserv.nl) to bypass
 * Strict Cross-Origin-Resource-Policy (CORP) headers found on platforms
 * like Instagram and Facebook.
 * 
 * @param src The original image URL
 * @returns The proxied URL or the original if no proxy triggers match
 */
export function getProxiedSrc(src?: string | null): string | undefined {
    if (!src) return undefined

    // Check for domains known to have strict CORP headers
    if (
        src.includes('fbcdn.net') ||
        src.includes('instagram.com') ||
        src.includes('cdninstagram.com')
    ) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(src)}&output=jpg&q=80`
    }

    return src
}
