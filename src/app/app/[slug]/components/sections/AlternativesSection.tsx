import Link from 'next/link';
import { AdminTool } from '@/types';
import { getFullUrl, logoColors } from '../utils';

interface AlternativesSectionProps {
    toolName: string;
    alternatives: AdminTool[];
}

/**
 * Renders the "Alternatives" section listing alternative tools for a given tool name.
 *
 * Displays either a message when no alternatives exist or a responsive grid of alternative cards.
 * Each card shows a logo or initial avatar, tool name, summary, optional category/task badges, and a pricing badge.
 *
 * @param toolName - Display name of the primary tool used in the section header
 * @param alternatives - Array of alternative tool entries to render
 * @returns The React element for the alternatives section
 */
export default function AlternativesSection({ toolName, alternatives }: AlternativesSectionProps) {
    return (
        <section id="alternatives" className="py-8">
            <h2 className="text-xl font-bold text-text-primary mb-4">Alternatives to {toolName}</h2>
            {alternatives.length === 0 ? (
                <p className="text-text-tertiary">No alternatives found in this category.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {alternatives.map((t) => {
                        const tColor = logoColors[t.name.charCodeAt(0) % logoColors.length];
                        const pricingColors = t.pricing === 'free'
                            ? 'bg-green-100 text-green-700'
                            : t.pricing === 'paid'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700';
                        return (
                            <Link
                                prefetch={false} key={t.id}
                                href={`/app/${t.app_username}`}
                                className="flex flex-col justify-between p-3 bg-bg-tertiary border border-border rounded-2xl hover:bg-bg-secondary no-underline transition-colors group h-full min-h-[120px]"
                            >
                                <div className="flex items-center gap-3">
                                    {t.logoUrl ? (
                                        <img src={getFullUrl(t.logoUrl)} alt={t.name} className="w-10 h-10 rounded-xl object-contain flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: tColor }}>
                                            {t.name[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-text-primary">{t.name}</div>
                                        <div className="text-xs text-text-tertiary line-clamp-1">{t.summary}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                        {t.categoryName?.[0] && (
                                            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[10px] font-medium">{t.categoryName[0]}</span>
                                        )}
                                        {t.taskName?.[0] && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-medium">{t.taskName[0]}</span>
                                        )}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize flex-shrink-0 ${pricingColors}`}>{t.pricing || 'freemium'}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}