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

export async function sendSubmissionEmail(
    type: SubmissionEmailType,
    data: SubmissionEmailData,
): Promise<string | null> {
    if (!resend) return null;

    const { submitter_name, submitter_email, tool_name, tool_url, plan, submission_ref } = data;

    let subject: string;
    let html: string;

    if (type === 'success') {
        subject = 'Thank you for submitting your AI tool to AiBDE';
        html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <p>Hello ${submitter_name || 'there'},</p>
        <p>Thank you for your submission.</p>
        <p>We have successfully received your purchase request for listing your tool on <strong>AiBDE</strong>.</p>
        <h3 style="margin-top: 24px; margin-bottom: 8px;">Submission Details</h3>
        <ul style="padding-left: 20px; margin-top: 4px; margin-bottom: 16px;">
          <li><strong>Tool Name:</strong> ${tool_name}</li>
          ${tool_url ? `<li><strong>Website:</strong> <a href="${tool_url}">${tool_url}</a></li>` : ''}
          <li><strong>Selected Plan:</strong> ${plan}</li>
          ${submission_ref ? `<li><strong>Submission ID:</strong> <code>${submission_ref}</code></li>` : ''}
        </ul>
        <p>Our team will review your submission soon.</p>
        <p>If your tool meets our guidelines, it will be published on <a href="https://www.aibde.tech">AiBDE.tech</a>.</p>
        <p style="margin-top: 24px;">Best regards<br/>AiBDE Team<br/><a href="https://www.aibde.tech">https://www.aibde.tech</a></p>
      </div>
    `;
    } else {
        subject = 'Your AiBDE submission payment was not completed';
        html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <p>Hello ${submitter_name || 'there'},</p>
        <p>We noticed that your payment attempt for submitting a tool to <strong>AiBDE</strong> was not completed.</p>
        <h3 style="margin-top: 24px; margin-bottom: 8px;">Submission Details</h3>
        <ul style="padding-left: 20px; margin-top: 4px; margin-bottom: 16px;">
          <li><strong>Tool Name:</strong> ${tool_name}</li>
          <li><strong>Selected Plan:</strong> ${plan}</li>
          ${submission_ref ? `<li><strong>Submission ID:</strong> <code>${submission_ref}</code></li>` : ''}
        </ul>
        <p>You may retry your submission again at any time.</p>
        <p style="margin-top: 24px;">Best regards<br/>AiBDE Team</p>
      </div>
    `;
    }

    try {
        const result = await resend.emails.send({
            from: 'AiBDE <support@aibde.tech>',
            to: submitter_email,
            replyTo: 'support@aibde.tech',
            subject,
            html,
        });

        // Resend returns an id we can store for debugging / tracing
        return (result as any)?.id ?? null;
    } catch (error) {
        console.error('[Emails] Failed to send submission email', { type, error });
        return null;
    }
}

