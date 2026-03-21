'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminTool, Category, Task } from '@/types';
import ShareModal from '@/components/ui/ShareModal';
import { useToolPageView, trackToolVisit } from '@/hooks/useToolAnalytics';
import { addUtmParams } from '@/lib/url-utils';

// Import all modular components
import {
    ToolHeader,
    StickyHeader,
    ToolSidebar,
    OverviewSection,
    MediaSection,
    FeaturesSection,
    UseCasesSection,
    PricingSection,
    ProsConsSection,
    FAQSection,
    AlternativesSection,
    getExtendedInfo,
    getSections,
} from './components';

interface ToolDetailClientProps {
    tool: AdminTool;
    relatedTools: AdminTool[];
    suggestedTools: AdminTool[];
    featuredTools: AdminTool[];
    recentlyAdded: AdminTool[];
    categories: Category[];
    tasks: Task[];
    showFeaturedAlternatives?: boolean;
}

export default function ToolDetailClient({
    tool,
    relatedTools,
    suggestedTools,
    featuredTools,
    recentlyAdded,
    categories,
    tasks,
    showFeaturedAlternatives = true,
}: ToolDetailClientProps) {
    const [activeSection, setActiveSection] = useState('overview');
    const [showStickyHeader, setShowStickyHeader] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(0);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Analytics: Track page view and time spent
    useToolPageView({
        id: tool.id,
        name: tool.name,
        appUsername: tool.appUsername,
        category: (tool.categoryName || [])[0],
        pricing: tool.pricing,
    });

    // Extended info
    const extendedInfo = useMemo(() => getExtendedInfo(tool), [tool]);

    // Dynamic sections
    const sections = useMemo(() => {
        return getSections(tool, extendedInfo, relatedTools.length > 0);
    }, [extendedInfo, relatedTools, tool]);

    // Track scroll for active section and sticky header
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setShowStickyHeader(scrollPosition > 280);

            const adjustedPosition = scrollPosition + 150;
            for (let i = sections.length - 1; i >= 0; i--) {
                const section = document.getElementById(sections[i].id);
                if (section && section.offsetTop <= adjustedPosition) {
                    setActiveSection(sections[i].id);
                    break;
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections]);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 pb-24 lg:pb-6">
                <ToolHeader
                    tool={tool}
                    sections={sections}
                    activeSection={activeSection}
                    onScrollToSection={scrollToSection}
                    onShare={() => setShowShareModal(true)}
                />

                <StickyHeader
                    tool={tool}
                    sections={sections}
                    activeSection={activeSection}
                    showStickyHeader={showStickyHeader}
                    onScrollToSection={scrollToSection}
                />

                <div className="flex gap-8 mt-6 flex-col lg:flex-row lg:items-start">
                    {/* Main Column */}
                    <div className="flex-1 min-w-0">
                        <OverviewSection
                            name={tool.name}
                            description={extendedInfo?.longDescription || ''}
                            isAiGenerated={tool.isAiGenerated}
                        />

                        {(tool.images?.length || tool.videos?.length) ? (
                            <MediaSection
                                images={tool.images || []}
                                videos={tool.videos || []}
                                selectedMedia={selectedMedia}
                                onSelectMedia={setSelectedMedia}
                            />
                        ) : null}

                        <FeaturesSection features={extendedInfo?.coreFeatures || []} />
                        <UseCasesSection useCases={extendedInfo?.useCases || []} />
                        <PricingSection plans={extendedInfo?.pricingPlans || []} />
                        <ProsConsSection
                            pros={extendedInfo?.pros || []}
                            cons={extendedInfo?.cons || []}
                        />
                        <FAQSection faq={extendedInfo?.faq || []} />
                        <AlternativesSection
                            toolName={tool.name}
                            alternatives={relatedTools}
                        />
                    </div>

                    <ToolSidebar
                        tool={tool}
                        featuredTools={featuredTools}
                        suggestedTools={suggestedTools}
                        recentlyAdded={recentlyAdded}
                        showFeaturedAlternatives={showFeaturedAlternatives}
                    />
                </div>
            </div>

            {/* Mobile Sticky Bottom Bar - Appears on scroll like top header */}
            <div className={`fixed bottom-0 left-0 right-0 z-[150] lg:hidden mb-24 flex justify-center px-4 transition-all duration-300 ${showStickyHeader ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
                {/* Sticky bar - glossy effect */}
                <div className="relative bg-bg-secondary rounded-full shadow-lg flex items-center gap-2.5 py-2 px-3">
                    {/* Tool info */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 pl-0.5">
                        {tool.logoUrl ? (
                            <img src={tool.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-accent-primary">{tool.name[0]}</span>
                            </div>
                        )}
                        <span className="text-sm font-medium text-text-primary truncate">{tool.name}</span>
                    </div>

                    {/* Try Now button */}
                    {tool.appUsername && (
                        <a
                            href={`/go/${tool.appUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                                const targetUrl = tool.affiliateEnabled && tool.affiliateUrl ? tool.affiliateUrl : tool.websiteUrl;
                                if (targetUrl) {
                                    trackToolVisit(
                                        { id: tool.id, name: tool.name, appUsername: tool.appUsername, category: (tool.categoryName || [])[0], pricing: tool.pricing },
                                        targetUrl
                                    );
                                }
                            }}
                            className="flex items-center justify-center px-3.5 py-1.5 bg-accent-primary text-white rounded-full text-xs font-medium hover:bg-accent-primary/90 transition-colors"
                        >
                            Try Now
                        </a>
                    )}

                    {/* Kebab menu */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="flex items-center justify-center w-7 h-7 rounded-full text-text-tertiary hover:text-text-primary transition-colors"
                        suppressHydrationWarning
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>

                    {/* Dropdown menu - glossy effect */}
                    {showMobileMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-[149]"
                                onClick={() => setShowMobileMenu(false)}
                            />
                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-bg-secondary rounded-xl shadow-xl overflow-hidden z-[150]">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => {
                                            scrollToSection(section.id);
                                            setShowMobileMenu(false);
                                        }}
                                        className={`flex items-center w-full px-4 py-2.5 text-left text-sm transition-colors ${activeSection === section.id
                                            ? 'bg-accent-primary/10 text-accent-primary font-medium'
                                            : 'text-text-primary hover:bg-bg-tertiary/80'
                                            }`}
                                        suppressHydrationWarning
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div >

            {/* Share Modal */}
            < ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)
                }
                url={typeof window !== 'undefined' ? window.location.href : (tool.appUsername ? `https://www.aibde.tech/app/${tool.appUsername}` : 'https://www.aibde.tech')}
                title={tool.name}
                description={tool.summary}
            />
        </>
    );
}
