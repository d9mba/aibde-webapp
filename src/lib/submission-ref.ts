/**
 * Generate a human-readable submission reference.
 * Format: A + DD + MM + YY + PLAN_CODE(3 letters) + UUID_SUFFIX(8 uppercase hex chars)
 * Example: A210326FEAA1B2C3D4 → day 21, month 03, year 26, plan "featured", UUID suffix
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
    
    // Use a random 2-digit sequence instead of long UUID
    const seq = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
    
    return `A${dd}${mm}${yy}${planCode}${seq}`;
}
