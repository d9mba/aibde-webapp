import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Submit Your AI Tool | Get Listed Free | AiBDE',
    description: 'Submit your AI tool to AiBDE directory for free. Get discovered by thousands of users looking for AI solutions. Review within 2-3 business days.',
    keywords: 'submit AI tool, list AI tool, add AI tool, AI directory submission, free AI listing, AiBDE submit',
    openGraph: {
        title: 'Submit Your AI Tool | AiBDE',
        description: 'Submit your AI tool to our directory for free and get discovered by thousands of users.',
        type: 'website',
        siteName: 'AiBDE',
        url: 'https://aibde.tech/submit',
    },
    twitter: {
        card: 'summary',
        title: 'Submit Your AI Tool | AiBDE',
        description: 'Submit your AI tool to our directory for free.',
    },
    alternates: {
        canonical: 'https://aibde.tech/submit',
    },
};

export default function SubmitLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
