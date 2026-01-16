/**
 * Add UTM tracking parameters to outbound URLs
 * 
 * Adds: ?ref=aibde&utm_source=aibde&utm_medium=referral
 */
export function addUtmParams(url: string): string {
    if (!url) return url;

    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

        // Add UTM params
        urlObj.searchParams.set('ref', 'aibde');
        urlObj.searchParams.set('utm_source', 'aibde');
        urlObj.searchParams.set('utm_medium', 'referral');

        return urlObj.toString();
    } catch {
        // If URL parsing fails, append params manually
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}ref=aibde&utm_source=aibde&utm_medium=referral`;
    }
}

/**
 * Ensure URL has protocol (http/https)
 */
export function ensureProtocol(url: string): string {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `https://${url}`;
}
