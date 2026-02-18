import { Metadata } from 'next';
import { getFaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'Contact Us | AI Tools Directory',
    description: 'Get in touch with the AiBDE team. Contact us for support, partnerships, advertising, feedback, or to submit your AI tool. We respond within 24-48 hours.',
    keywords: 'contact AiBDE, AI tools support, submit AI tool, advertise on AiBDE, AI directory contact, partnership inquiry',
    openGraph: {
        title: 'Contact Us | AI Tools Directory',
        description: 'Get in touch with the AiBDE team for support, partnerships, or feedback.',
        type: 'website',
        siteName: 'AiBDE',
        url: 'https://aibde.tech/contact',
    },
    twitter: {
        card: 'summary',
        title: 'Contact Us | AI Tools Directory',
        description: 'Get in touch with the AiBDE team.',
    },
    alternates: {
        canonical: 'https://aibde.tech/contact',
    },
};

const contactFaqs = [
    { question: 'How do I submit a new AI tool?', answer: 'Use our Submit Tool page to add your AI product. Fill in the required details and our team will review your submission within 48 hours.' },
    { question: 'How can I feature my tool on AiBDE?', answer: 'We offer featured placements and spotlight promotions for AI tools. Contact us at support@aibde.tech with "Featured Listing" in the subject line for pricing and availability.' },
    { question: 'How can I advertise on AiBDE?', answer: 'We offer various advertising options including banner ads, sponsored listings, and newsletter sponsorships. Email us at support@aibde.tech for our media kit and rates.' },
    { question: 'How do I update information about my AI tool?', answer: 'Email us at support@aibde.tech with your tool name and the changes you\'d like to make. We\'ll update the listing within 24-48 hours.' },
    { question: 'Is it free to list my AI tool on AiBDE?', answer: 'Yes! Basic listings are completely free. You can submit your AI tool and it will be reviewed and added to our directory at no cost. Premium features like featured placements are available for a fee.' },
    { question: 'How long does the review process take?', answer: 'We typically review and approve submissions within 24-48 business hours. If we need additional information, we\'ll reach out via the email you provided.' },
    { question: 'Can I remove my tool from AiBDE?', answer: 'Yes, you can request removal of your tool at any time. Simply email us at support@aibde.tech with your tool name and we\'ll process the removal within 24 hours.' },
    { question: 'Do you accept guest posts or sponsored content?', answer: 'We currently don\'t accept guest posts. However, we do offer sponsored content opportunities. Contact us at support@aibde.tech to discuss options.' },
    { question: 'What is the typical response time for inquiries?', answer: 'We aim to respond to all inquiries within 24-48 business hours. For urgent matters, please mention "URGENT" in your subject line.' },
];

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(getFaqJsonLd(contactFaqs)) }}
            />
            {children}
        </>
    );
}
