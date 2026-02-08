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
                                        <div className="font-medium text-text-primary flex items-center gap-1">
                                            {t.name}
                                            {t.listingType === 'verified' && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#1d9bf0" className="flex-shrink-0">
                                                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                </svg>
                                            )}
                                            {(t.listingType === 'featured' || t.listingType === 'spotlight' || t.spotlightEnabled || t.isFeatured) && t.listingType !== 'verified' && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" className="flex-shrink-0">
                                                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                                                </svg>
                                            )}
                                        </div>
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
