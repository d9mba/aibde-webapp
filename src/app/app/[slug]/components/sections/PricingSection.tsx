interface PricingPlan {
    name: string;
    price: string;
    features?: string[];
    highlighted?: boolean;
}

interface PricingSectionProps {
    plans: PricingPlan[];
}

export default function PricingSection({ plans }: PricingSectionProps) {
    if (plans.length === 0) return null;

    return (
        <section id="pricing" className="py-6 border-b border-border" aria-labelledby="pricing-heading">
            <h2 id="pricing-heading" className="text-xl font-bold text-text-primary mb-4">Pricing Plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((plan, idx) => (
                    <div
                        key={idx}
                        className={`relative p-5 rounded-xl border transition-colors ${plan.highlighted
                            ? 'border-accent-primary bg-accent-primary/5'
                            : 'border-border bg-bg-card hover:border-accent-primary'
                            }`}
                        aria-label={plan.highlighted ? `${plan.name} - Popular plan` : undefined}
                        role={plan.highlighted ? 'region' : undefined}
                    >
                        {plan.highlighted && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold bg-accent-primary text-white rounded-full">
                                Popular
                            </span>
                        )}
                        <div className="text-sm font-medium text-text-secondary">{plan.name}</div>
                        <div className="text-2xl font-bold text-text-primary mt-1">{plan.price}</div>
                        <ul className="mt-4 space-y-2">
                            {(plan.features || []).map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                                    <span className="text-accent-green">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}
