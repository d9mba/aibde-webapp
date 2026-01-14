'use client';

import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    faq: FAQItem[];
}

export default function FAQSection({ faq }: FAQSectionProps) {
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    if (faq.length === 0) return null;

    return (
        <section id="faq" className="py-6 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
                {faq.map((item, idx) => (
                    <div key={idx} className="bg-bg-tertiary rounded-2xl overflow-hidden">
                        <button
                            onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg-secondary transition-colors"
                            suppressHydrationWarning
                        >
                            <span className="font-medium text-text-primary">{item.question}</span>
                            <svg
                                className={`w-5 h-5 text-text-tertiary transition-transform duration-300 ease-in-out flex-shrink-0 ml-4 ${expandedFAQ === idx ? 'rotate-180' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="6,9 12,15 18,9" />
                            </svg>
                        </button>
                        <div className={`grid transition-all duration-300 ease-in-out ${expandedFAQ === idx ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="px-5 pb-4 text-text-secondary text-sm">{item.answer}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
