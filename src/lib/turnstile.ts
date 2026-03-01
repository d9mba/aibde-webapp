const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

/**
 * Verify a Cloudflare Turnstile token.
 * In production, returns false if the secret key is missing.
 * In dev, skips verification if the key is not configured.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
    if (!TURNSTILE_SECRET_KEY) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[Turnstile] Secret key not configured');
            return false;
        }
        console.warn('[Turnstile] Secret key not configured, skipping in dev');
        return true;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: TURNSTILE_SECRET_KEY,
                response: token,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) return false;

        const data = await response.json();
        return data.success === true;
    } catch (err) {
        console.error('[Turnstile] Verification error:', err);
        return false;
    }
}
