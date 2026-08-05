import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About | AI Tools Directory Mission & Vision',
    description: 'Learn about BrowseForAI - your trusted AI tools directory. Our mission is to make AI accessible by curating the best AI tools for writing, design, coding, marketing, and productivity.',
    keywords: [
        'about BrowseForAI',
        'AI tools directory',
        'AI discovery platform',
        'find AI tools',
        'AI tools mission',
    ].join(', '),
    openGraph: {
        title: 'About | AI Tools Directory',
        description: 'Learn about BrowseForAI - your trusted AI tools directory. Our mission is to make AI accessible to everyone.',
        type: 'website',
        siteName: 'BrowseForAI',
        url: 'https://www.browseforai.com/about',
    },
    twitter: {
        card: 'summary',
        title: 'About | AI Tools Directory',
        description: 'Learn about BrowseForAI - your trusted AI tools directory.',
    },
    alternates: {
        canonical: 'https://www.browseforai.com/about',
    },
};

export default function AboutPage() {
    return (
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-6">About BrowseForAI</h1>

            <div className="prose prose-lg text-text-secondary space-y-6">
                <p>
                    BrowseForAI is your go-to directory for discovering the best AI tools for your everyday tasks.
                    We curate and organize AI-powered applications across various categories to help you find
                    the perfect tool for any job.
                </p>

                <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Our Mission</h2>
                <p>
                    Our mission is to make AI accessible to everyone by providing a comprehensive,
                    easy-to-navigate directory of AI tools. Whether you&apos;re a developer, designer,
                    marketer, or just curious about AI, we&apos;ve got something for you.
                </p>

                <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">What We Offer</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Curated collection of top AI tools</li>
                    <li>Easy-to-use search and filtering</li>
                    <li>Detailed tool information and reviews</li>
                    <li>Regular updates with new tools</li>
                    <li>Categories organized by use case</li>
                </ul>

                <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Contact Us</h2>
                <p>
                    Have questions or suggestions? We&apos;d love to hear from you!
                    Reach out to us at <a href="mailto:support@browseforai.com" className="text-accent-primary hover:underline">support@browseforai.com</a>.
                </p>
            </div>
        </div>
    );
}
