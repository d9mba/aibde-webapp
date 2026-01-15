import Link from 'next/link';
import { AdminTool } from '@/types';
import { getFullUrl, logoColors } from '../utils';

interface AlternativesSectionProps {
    toolName: string;
    alternatives: AdminTool[];
}

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
                                href={`/app/${t.slug}`}
                                className="flex flex-col p-3 bg-bg-tertiary border border-border rounded-2xl hover:bg-bg-secondary no-underline transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    {t.logoUrl ? (
                                        <img src={getFullUrl(t.logoUrl)} alt={t.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
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
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                    {t.categoryName?.[0] && (
                                        <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full text-[10px] font-medium">{t.categoryName[0]}</span>
                                    )}
                                    {t.taskName?.[0] && (
                                        <span className="px-2 py-0.5 bg-accent-green/10 text-accent-green rounded-full text-[10px] font-medium">{t.taskName[0]}</span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${pricingColors}`}>{t.pricing || 'freemium'}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
