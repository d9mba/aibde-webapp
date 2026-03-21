/**
 * Generate a human-readable submission reference.
 * Format: A + DD + MM + YY + PLAN_CODE(3 letters) + seq(01-99)
 * Example: A210326FEA01 = day 21, month 03, year 26, plan "featured", seq 01
 */
const PLAN_CODES: Record<string, string> = {
    basic: 'BAS',
    verified: 'VER',
    featured: 'FEA',
};

export function generateSubmissionRef(plan?: string): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const planCode = PLAN_CODES[(plan || '').toLowerCase()] || 'SUB';
    const seq = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
    return `A${dd}${mm}${yy}${planCode}${seq}`;
}
