/**
 * Generate a human-readable submission reference.
 * Format: A + DD + MM + YY + PLAN_CODE(3 letters) + UUID suffix
 * Example: A210326FEA-a1b2c3d4 = day 21, month 03, year 26, plan "featured", UUID suffix
 */
const PLAN_CODES: Record<string, string> = {
    basic: 'BAS',
    verified: 'VER',
    featured: 'FEA',
};

export function generateSubmissionRef(plan?: string): string {
    // Use UTC to ensure consistent dates across timezones
    const now = new Date();
    const yy = String(now.getUTCFullYear()).slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const planCode = PLAN_CODES[(plan || '').toLowerCase()] || 'SUB';
    
    // Use crypto.randomUUID for stronger uniqueness
    const uuid = crypto.randomUUID().slice(0, 8).toUpperCase();
    
    return `A${dd}${mm}${yy}${planCode}${uuid}`;
}
