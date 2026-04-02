/**
 * Generate a human-readable submission reference.
 * Format: A + DD + MM + YY + PLAN_CODE(3 letters) + RANDOM(5 alphanumeric)
 * Example: A210326FEAX7K2P → day 21, month 03, year 26, plan "featured", random 5-char suffix
 */
const PLAN_CODES: Record<string, string> = {
    basic: 'BAS',
    verified: 'VER',
    featured: 'FEA',
};

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateSubmissionRef(plan?: string): string {
    // Use UTC to ensure consistent dates across timezones
    const now = new Date();
    const yy = String(now.getUTCFullYear()).slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const planCode = PLAN_CODES[(plan || '').toLowerCase()] || 'SUB';

    // Generate exactly 5 uppercase alphanumeric characters using crypto-safe random
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    const seq = Array.from(bytes, b => ALPHANUMERIC[b % ALPHANUMERIC.length]).join('');

    return `A${dd}${mm}${yy}${planCode}${seq}`;
}
