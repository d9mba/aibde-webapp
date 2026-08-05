import { Metadata } from 'next';
import { getFaqJsonLd } from '@/lib/seo';
import { SEO } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'Submit Your AI Tool | BrowseForAI',
    description: 'Submit your AI tool to BrowseForAI and reach developers, founders, and AI enthusiasts searching for innovative tools. Get listed in a premium AI directory.',
    keywords: 'submit ai tool, ai directory submission, list ai tools, add ai tool, BrowseForAI submit, AI tool directory',
    openGraph: {
        title: 'Submit Your AI Tool | BrowseForAI',
        description: 'Submit your AI tool to BrowseForAI and reach developers, founders, and AI enthusiasts searching for innovative tools.',
        type: 'website',
        siteName: 'BrowseForAI',
        url: `${SEO.siteUrl}/submit`,
        images: [`${SEO.siteUrl}/twitter-image.png`],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Submit Your AI Tool | BrowseForAI',
        description: 'Submit your AI tool to BrowseForAI and reach developers, founders, and AI enthusiasts searching for innovative tools.',
        images: [`${SEO.siteUrl}/twitter-image.png`],
    },
    alternates: {
        canonical: `${SEO.siteUrl}/submit`,
    },
};

const submitFaqs = [
    { question: 'How long does approval take?', answer: 'Most submissions are reviewed within 24–48 hours. We\'ll notify you by email once your tool is live.' },
    { question: 'Can I edit my listing later?', answer: 'Yes. Email support@browseforai.com with your tool name and the changes you\'d like. We\'ll update the listing within 24–48 hours.' },
    { question: 'Do you offer featured placements?', answer: 'Yes! Our Featured plan ($249) gives you homepage visibility, newsletter features, and priority category ranking for maximum exposure.' },
    { question: 'Is there a free listing option?', answer: 'We currently offer three paid plans starting at $49. Each plan ensures manual review and a permanent listing in our directory.' },
    { question: 'What\'s the difference between Basic, Verified, and Featured?', answer: 'Basic ($49) gets you listed with standard SEO. Verified ($99) adds a blue verified badge, priority review, and social mention. Featured ($249) includes a gold badge, 3-day homepage placement, newsletter feature, and analytics access.' },
    { question: 'Can I get a refund?', answer: 'If your tool is not approved after review, we offer a full refund. Contact support@browseforai.com for assistance.' },
    { question: 'What categories do you support?', answer: 'We support AI Assistant, Productivity, Developer Tools, Marketing, Design, Automation, Video, Research, and more. If your tool doesn\'t fit, select "Other" and specify your category.' },
    { question: 'How does BrowseForAI help with SEO?', answer: 'Every listing gets a dedicated page with structured data, FAQ schema, meta tags, and internal linking — helping your tool rank in Google search results.' },
    { question: 'Do you verify the tools you list?', answer: 'Yes. Our editorial team manually reviews each submission for quality, functionality, and relevance before it goes live.' },
    { question: 'Can I submit multiple tools?', answer: 'Absolutely! Each tool requires a separate submission and plan. Volume discounts are available — contact support@browseforai.com.' },
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
