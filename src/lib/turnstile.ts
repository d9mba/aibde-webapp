const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';

interface TurnstileResponse {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    'error-codes'?: string[];
}

/**
 * Verify a Cloudflare Turnstile token.
 * In production, returns false if the secret key is missing.
 * In dev, skips verification if the secret key is missing AND TURNSTILE_SKIP_VERIFICATION=true.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
    if (!token || token.trim() === '') {
        return false;
    }

    if (!TURNSTILE_SECRET_KEY) {
        // Only allow skipping in development/test environments
        const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        if (isDev && process.env.TURNSTILE_SKIP_VERIFICATION === 'true') {
            console.warn('[Turnstile] Verification skipped (TURNSTILE_SKIP_VERIFICATION=true, dev mode)');
            return true;
        }
        console.error('[Turnstile] Secret key not configured. Set TURNSTILE_SKIP_VERIFICATION=true in dev to skip.');
        return false;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    secret: TURNSTILE_SECRET_KEY,
                    response: token,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const body = await response.text();
                console.error(`[Turnstile] HTTP ${response.status}: ${body}`);
                return false;
            }

            const data: TurnstileResponse = await response.json();
            return data.success === true;
        } finally {
            clearTimeout(timeout);
        }
    } catch (err) {
        console.error('[Turnstile] Verification error:', err);
        return false;
    }
}
