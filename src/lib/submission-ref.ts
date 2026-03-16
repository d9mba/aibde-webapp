/**
 * Generate a human-readable submission reference: A + YYMMDD + HHMMSS + 2-digit suffix.
 * Example: A250314093501 (A + 25/03/14 + 09:35:01 + 01)
 * Uniqueness: same-second submissions get a random 01–99 suffix; retry on DB conflict if needed.
 */
export function generateSubmissionRef(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const suffix = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
    return `A${yy}${mm}${dd}${hh}${min}${ss}${suffix}`;
}
