import { Metadata } from 'next';
import { getFaqJsonLd } from '@/lib/seo';
import { SEO } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'Submit Your AI Tool | AiBDE',
    description: 'Submit your AI tool to AiBDE and reach developers, founders, and AI enthusiasts searching for innovative tools. Get listed in a premium AI directory.',
    keywords: 'submit ai tool, ai directory submission, list ai tools, add ai tool, AiBDE submit, AI tool directory',
    openGraph: {
        title: 'Submit Your AI Tool | AiBDE',
        description: 'Submit your AI tool to AiBDE and reach developers, founders, and AI enthusiasts searching for innovative tools.',
        type: 'website',
        siteName: 'AiBDE',
        url: `${SEO.siteUrl}/submit`,
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Submit Your AI Tool | AiBDE',
        description: 'Submit your AI tool to AiBDE and reach developers, founders, and AI enthusiasts searching for innovative tools.',
    },
    alternates: {
        canonical: `${SEO.siteUrl}/submit`,
    },
};

const submitFaqs = [
    { question: 'How long does approval take?', answer: 'Your submission will be reviewed within 24–48 hours for paid plans. Free listings may take longer. We\'ll notify you by email once your tool is live.' },
    { question: 'Can I update my listing later?', answer: 'Yes. Email support@aibde.tech with your tool name and the changes you\'d like. We\'ll update the listing within 24–48 hours.' },
    { question: 'Do you offer featured placements?', answer: 'Yes. We offer Featured and Premium Launch plans for priority placement, homepage visibility, and maximum exposure. Choose a plan when submitting.' },
    { question: 'Is there a free listing option?', answer: 'Yes. Our Free Listing plan gives you a basic listing with standard approval. Paid plans offer priority review and enhanced visibility.' },
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
