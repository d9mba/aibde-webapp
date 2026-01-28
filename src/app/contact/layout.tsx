import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us | AiBDE - AI Tools Directory',
    description: 'Get in touch with the AiBDE team. Contact us for support, partnerships, advertising, feedback, or to submit your AI tool. We respond within 24-48 hours.',
    keywords: 'contact AiBDE, AI tools support, submit AI tool, advertise on AiBDE, AI directory contact, partnership inquiry',
    openGraph: {
        title: 'Contact Us | AiBDE',
        description: 'Get in touch with the AiBDE team for support, partnerships, or feedback.',
        type: 'website',
        siteName: 'AiBDE',
        url: 'https://aibde.tech/contact',
    },
    twitter: {
        card: 'summary',
        title: 'Contact Us | AiBDE',
        description: 'Get in touch with the AiBDE team.',
    },
    alternates: {
        canonical: 'https://aibde.tech/contact',
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
