'use client';

import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { Category } from '@/types';
import { getPricingClass, getPricingLabel } from '@/lib/formatters';
import { getFullUrl } from '@/lib/url';

interface LivePreviewProps {
    control: Control<any>;
    categories: Category[];
    onExpand: () => void;
}

export default function LivePreview({ control, categories, onExpand }: LivePreviewProps) {
    // Only re-renders when these specific fields change
    const watchedValues = useWatch({
        control,
        name: ['name', 'summary', 'logoUrl', 'categoryName', 'pricing', 'hasFreeTrial', 'freeTrialDays', 'websiteUrl', 'affiliateUrl', 'affiliateEnabled'],
    });

    const [name, summary, logoUrl, categoryNameVal, pricing, hasFreeTrial, freeTrialDays, websiteUrl, affiliateUrl, affiliateEnabled] = watchedValues as any[];

    // categoryName is now an array
    const categoryNames = Array.isArray(categoryNameVal) ? categoryNameVal : [];
    const firstCategoryName = categoryNames[0] || '';
    const category = categories.find(c => c.categoryName === firstCategoryName);
    const logoSrc = getFullUrl(logoUrl);

    return (
        <div className="bg-bg-card border border-border rounded-xl p-4 sticky top-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-text-secondary">Live Preview</h3>
                <button type="button" onClick={onExpand} className="text-xs text-accent-primary">
                    Expand ↗
                </button>
            </div>

            <div className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-xl bg-bg-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoSrc ? (
                        <img src={logoSrc} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl text-text-tertiary">🔧</span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-text-primary truncate">
                        {name || 'Tool Name'}
                    </h2>
                    <p className="text-sm text-text-secondary line-clamp-2">
                        {summary || 'Short summary will appear here...'}
                    </p>

                    <div className="flex gap-2 mt-2 flex-wrap">
                        {categoryNames.length > 0 && (
                            <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded text-xs">
                                {firstCategoryName}{categoryNames.length > 1 && ` +${categoryNames.length - 1}`}
                            </span>
                        )}
                        {pricing && (
                            <span className={`px-2 py-0.5 rounded text-xs ${getPricingClass(pricing)}`}>
                                {getPricingLabel(pricing)}
                            </span>
                        )}
                        {hasFreeTrial && (
                            <span className="px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded text-xs">
                                {freeTrialDays} day trial
                            </span>
                        )}
                    </div>
                </div>

                <a
                    href={affiliateEnabled && affiliateUrl ? affiliateUrl : websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-1.5 rounded-lg text-sm ${websiteUrl ? 'bg-accent-primary text-white' : 'bg-bg-tertiary text-text-tertiary pointer-events-none'
                        }`}
                >
                    Visit →
                </a>
            </div>
        </div>
    );
}
