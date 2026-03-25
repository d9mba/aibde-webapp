import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV === 'production') {
    console.error('[Emails] RESEND_API_KEY is not set – submission emails will not be sent');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

type SubmissionEmailType = 'success' | 'failed';

export interface SubmissionEmailData {
    submitter_name: string;
    submitter_email: string;
    tool_name: string;
    tool_url?: string | null;
    plan: string;
    /** Human-readable ref e.g. A250314093501 */
    submission_ref?: string | null;
}

/**
 * HTML escape utility to prevent XSS injection
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Validate and sanitize URL to prevent malicious protocols
 */
function sanitizeUrl(urlString: string | null | undefined): string | null {
    if (!urlString) return null;
    try {
        // If no protocol, assume https
        const url = urlString.startsWith('http') ? urlString : `https://${urlString}`;
        const parsed = new URL(url);
        // Only allow http and https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }
        return parsed.href;
    } catch {
        return null;
    }
}

export async function sendSubmissionEmail(
    type: SubmissionEmailType,
    data: SubmissionEmailData,
): Promise<string | null> {
    if (!resend) return null;

    const { submitter_name, submitter_email, tool_name, tool_url, plan, submission_ref } = data;

    // Escape user inputs to prevent HTML injection
    const safeName = escapeHtml(submitter_name || 'there');
    const safeToolName = escapeHtml(tool_name || 'Your tool');
    const safePlan = escapeHtml(plan || 'basic');
    const safeRef = escapeHtml(submission_ref || '');
    const safeUrl = sanitizeUrl(tool_url);
    const safeUrlDisplay = safeUrl ? escapeHtml(safeUrl.replace(/^https?:\/\//, '')) : null;

    let subject: string;
    let html: string;

    if (type === 'success') {
        subject = 'Thank you for submitting your AI tool to AiBDE';
        html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <p>Hello ${safeName},</p>
        <p>Thank you for your submission.</p>
        <p>We have successfully received your purchase request for listing your tool on <strong>AiBDE</strong>.</p>
        <h3 style="margin-top: 24px; margin-bottom: 8px;">Submission Details</h3>
        <ul style="padding-left: 20px; margin-top: 4px; margin-bottom: 16px;">
          <li><strong>Tool Name:</strong> ${safeToolName}</li>
          ${safeUrl ? `<li><strong>Website:</strong> <a href="${safeUrl}" target="_blank">${safeUrlDisplay}</a></li>` : ''}
          <li><strong>Selected Plan:</strong> ${safePlan}</li>
          ${safeRef ? `<li><strong>Submission ID:</strong> <code>${safeRef}</code></li>` : ''}
        </ul>
        <p>Our team will review your submission soon.</p>
        <p>If your tool meets our guidelines, it will be published on <a href="https://www.aibde.tech" target="_blank">AiBDE.tech</a>.</p>
        <p style="margin-top: 24px;">Best regards<br/>AiBDE Team<br/><a href="https://www.aibde.tech">https://www.aibde.tech</a></p>
      </div>
    `;
    } else {
        subject = 'Your AiBDE submission payment was not completed';
        html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <p>Hello ${safeName},</p>
        <p>We noticed that your payment attempt for submitting a tool to <strong>AiBDE</strong> was not completed.</p>
        <h3 style="margin-top: 24px; margin-bottom: 8px;">Submission Details</h3>
        <ul style="padding-left: 20px; margin-top: 4px; margin-bottom: 16px;">
          <li><strong>Tool Name:</strong> ${safeToolName}</li>
          <li><strong>Selected Plan:</strong> ${safePlan}</li>
          ${safeRef ? `<li><strong>Submission ID:</strong> <code>${safeRef}</code></li>` : ''}
        </ul>
        <p>You may retry your submission again at any time.</p>
        <p style="margin-top: 24px;">Best regards<br/>AiBDE Team</p>
      </div>
    `;
    }

    try {
        const { data: emailData, error } = await resend.emails.send({
            from: 'AiBDE <support@aibde.tech>',
            to: submitter_email,
            replyTo: 'support@aibde.tech',
            subject,
            html,
        });

        if (error) {
            console.error('[Emails] Failed to send submission email', { type, error });
            return null;
        }

        return emailData?.id ?? null;
    } catch (error) {
        console.error('[Emails] Failed to send submission email', { type, error });
        return null;
    }
}

