interface FeaturesSectionProps {
    features: string[];
}

export default function FeaturesSection({ features }: FeaturesSectionProps) {
    if (features.length === 0) return null;

    return (
        <section id="features" className="py-6 border-b border-border">
            <h2 className="text-xl font-bold text-text-primary mb-4">Core Features</h2>
            <div className="space-y-3">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-text-secondary">{feature}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
