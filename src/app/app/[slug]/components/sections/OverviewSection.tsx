import { fixHtmlUrls } from '../utils';

interface OverviewSectionProps {
    name: string;
    description: string;
}

export default function OverviewSection({ name, description }: OverviewSectionProps) {
    return (
        <section id="overview" className="py-8 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary mb-4">{name} Overview</h2>
            <div
                className="text-text-secondary rich-text"
                dangerouslySetInnerHTML={{ __html: fixHtmlUrls(description) }}
            />
        </section>
    );
}
