/**
 * Redirect origin validation for payment return URLs.
 * Shared across submit-tool and payments/retry endpoints.
 */

const ALLOWED_ORIGINS: string[] = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://aibde.tech,https://www.aibde.tech')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

/**
 * Check whether a client-supplied base URL belongs to an allowed origin.
 * Prevents open-redirect attacks via payment return URLs.
 */
export function isAllowedRedirectOrigin(baseUrl: string): boolean {
    try {
        const url = new URL(baseUrl);
        return ALLOWED_ORIGINS.some(allowed => {
            try {
                return url.origin === new URL(allowed).origin;
            } catch {
                return false;
            }
        });
    } catch {
        return false;
    }
}
