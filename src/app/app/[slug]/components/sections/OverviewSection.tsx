'use client';

import { SafeHtml } from '@/components/ui/SafeHtml';
import { fixHtmlUrls } from '../utils';

interface OverviewSectionProps {
    name: string;
    description: string;
}

export default function OverviewSection({ name, description }: OverviewSectionProps) {
    return (
        <section id="overview" className="py-8 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary mb-4">{name} Overview</h2>
            <SafeHtml
                html={fixHtmlUrls(description)}
                className="text-text-secondary rich-text"
            />
        </section>
    );
}
