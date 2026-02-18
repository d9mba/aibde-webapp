import { Metadata } from 'next';
import { getFaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'Submit Your AI Tool | Get Listed Free',
    description: 'Submit your AI tool to AiBDE directory for free. Get discovered by thousands of users looking for AI solutions. Review within 2-3 business days.',
    keywords: 'submit AI tool, list AI tool, add AI tool, AI directory submission, free AI listing, AiBDE submit',
    openGraph: {
        title: 'Submit Your AI Tool | Get Listed Free',
        description: 'Submit your AI tool to our directory for free and get discovered by thousands of users.',
        type: 'website',
        siteName: 'AiBDE',
        url: 'https://aibde.tech/submit',
    },
    twitter: {
        card: 'summary',
        title: 'Submit Your AI Tool | Get Listed Free',
        description: 'Submit your AI tool to our directory for free.',
    },
    alternates: {
        canonical: 'https://aibde.tech/submit',
    },
};

const submitFaqs = [
    { question: 'Is it free to submit my AI tool?', answer: 'Yes! Basic listings are completely free during our limited-time offer. Submit your AI tool and it will be reviewed and added to our directory at no cost.' },
    { question: 'How long does the review process take?', answer: 'Free submissions may take up to a week or more. For fast-track review (24-48 hours), email us at support@aibde.tech.' },
    { question: 'Will I be notified when my tool is published?', answer: 'Yes! You will receive an email notification when your AI tool goes live on our directory.' },
    { question: 'What makes a good submission?', answer: 'Include a clear description, working website URL, accurate pricing information, and high-quality screenshots. The more details you provide, the faster we can review your tool.' },
    { question: 'Are NSFW or adult tools allowed?', answer: 'No. We do not accept NSFW, adult, or explicit content. Submissions containing such content will be rejected without refund.' },
    { question: 'What is the refund policy?', answer: 'For paid featured listings, if your tool is not approved during review, you will receive a full refund. Exception: No refunds are provided for NSFW/adult content submissions as they violate our guidelines.' },
    { question: 'Can I update my tool after submission?', answer: 'Yes! Email us at support@aibde.tech with your tool name and the changes you\'d like to make. We\'ll update the listing within 24-48 hours.' },
    { question: 'Will my submission be approved?', answer: 'Submissions may or may not be approved at our discretion. We verify all submissions to ensure quality and accuracy. Tools must be publicly accessible and provide genuine value.' },
    { question: 'How can I feature my tool on AiBDE?', answer: 'We offer featured placements and spotlight promotions. Contact us at support@aibde.tech with "Featured Listing" in the subject line.' },
];

export default function SubmitLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(getFaqJsonLd(submitFaqs)) }}
            />
            {children}
        </>
    );
}
