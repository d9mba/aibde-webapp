/**
 * 404 Page - Not Found
 * 
 * Custom 404 page that shows a friendly message and suggests
 * featured and recently added AI tools to explore.
 */

import Link from 'next/link';
import { getSpotlightTools, getRecentlyReleasedTools } from '@/lib/data';
import AIToolCard from '@/components/features/tools/ToolCard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Page Not Found | AiBDE',
    description: 'The page you are looking for does not exist. Explore our collection of AI tools instead.',
};

export default async function NotFound() {
    // Fetch only limited featured and recent tools (not all 10K+)
    const [spotlightTools, recentTools] = await Promise.all([
        getSpotlightTools(6),
        getRecentlyReleasedTools(6),
    ]);

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            {/* Hero Section */}
            <section className="text-center py-8 mb-8">
                {/* Main Message */}
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">
                    Page Not Found
                </h1>
                <p className="text-lg text-text-secondary mb-2">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <p className="text-base text-text-tertiary mb-6">
                    No worries! Let us help you discover some incredible AI tools instead.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-accent-primary rounded-full transition-opacity hover:opacity-90"
                    >
                        Back to Home
                    </Link>
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-text-secondary bg-bg-card border border-border rounded-full transition-all duration-200 hover:border-text-tertiary hover:shadow-md hover:text-text-primary"
                    >
                        Search Tools
                    </Link>
                </div>
            </section>

            {/* Featured Tools Section - Same layout as search page */}
            {spotlightTools.length > 0 && (
                <section className="mb-12 pt-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-text-primary">Featured Tools</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {spotlightTools.map((tool) => (
                            <AIToolCard key={tool.id} tool={tool} />
                        ))}
                    </div>
                </section>
            )}

            {/* Recently Added Section - Same layout as search page */}
            {recentTools.length > 0 && (
                <section className="pt-10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-text-primary">Recently Added</h2>
                        <Link href="/new" className="text-sm text-text-tertiary hover:text-accent-primary transition-colors">
                            View all
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentTools.map((tool) => (
                            <AIToolCard key={tool.id} tool={tool} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
