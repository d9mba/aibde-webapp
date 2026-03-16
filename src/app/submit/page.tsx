'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Send,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    Check,
    Link2,
    Users,
    Bookmark,
    ArrowRight,
    Sparkles,
    BarChart3,
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const PRICING_OPTIONS = [
    { value: 'free', label: 'Free' },
    { value: 'freemium', label: 'Freemium' },
    { value: 'paid', label: 'Paid' },
    { value: 'free_trial', label: 'Free Trial' },
    { value: 'open_source', label: 'Open Source' },
];

interface FormData {
    submitterName: string;
    submitterEmail: string;
    toolName: string;
    toolUrl: string;
    shortDescription: string;
    longDescription: string;
    pricing: string;
    releasedDate: string;
    tags: string;
    features: string;
    hasAffiliateProgram: boolean;
    affiliateUrl: string;
    imageUrls: string;
    videoUrls: string;
    plan: 'basic' | 'verified' | 'featured';
}

interface RecentTool {
    id: string;
    name: string;
    appUsername?: string;
    logoUrl?: string | null;
    summary?: string | null;
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="submit-card px-8 py-6 text-center">
            <div className="text-3xl font-bold tracking-tight text-[var(--accent-primary)]">{value}</div>
            <div className="mt-2 text-sm font-medium text-[var(--text-secondary)]">{label}</div>
        </div>
    );
}

function WhyCard({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="submit-card p-6 sm:p-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                <Icon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">{description}</p>
        </div>
    );
}

function FAQAccordion({ question, children }: { question: string; children: React.ReactNode }) {
    return (
        <details className="group border-b border-[var(--border-color)] last:border-0">
            <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-left text-base font-medium text-[var(--text-primary)] transition hover:text-[var(--accent-primary)] [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] transition group-open:rotate-180" />
            </summary>
            <div className="pb-5 text-[15px] leading-relaxed text-[var(--text-secondary)]">{children}</div>
        </details>
    );
}

function SubmitPageContent({ isPreview }: { isPreview: boolean }) {
    const [formData, setFormData] = useState<FormData>({
        submitterName: '',
        submitterEmail: '',
        toolName: '',
        toolUrl: '',
        shortDescription: '',
        longDescription: '',
        pricing: '',
        releasedDate: '',
        tags: '',
        features: '',
        hasAffiliateProgram: false,
        affiliateUrl: '',
        imageUrls: '',
        videoUrls: '',
        plan: 'verified',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(isPreview);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
    const [recentTools, setRecentTools] = useState<RecentTool[]>([]);
    const turnstileRef = useRef<TurnstileInstance>(null);

    useEffect(() => {
        fetch('/api/public/tools?limit=8')
            .then((r) => r.json())
            .then((d) => setRecentTools(d.data || []))
            .catch(() => {});
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
        setError('');
        if (value) setFieldErrors((prev) => ({ ...prev, [name]: false }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!agreedToGuidelines) {
            setError('Please agree to the submission guidelines.');
            return;
        }
        const errors: Record<string, boolean> = {};
        if (!formData.submitterName) errors.submitterName = true;
        if (!formData.submitterEmail) errors.submitterEmail = true;
        if (!formData.toolName) errors.toolName = true;
        if (!formData.toolUrl) errors.toolUrl = true;
        if (!formData.shortDescription) errors.shortDescription = true;
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Please complete the required fields.');
            return;
        }
        if (!turnstileToken) {
            setError('Please complete the security check.');
            return;
        }
        setIsSubmitting(true);
        try {
            const baseUrl = window.location.origin;
            const response = await fetch('/api/submit-tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    description: formData.shortDescription,
                    socialLinks: [],
                    turnstileToken,
                    baseUrl,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Submission failed');
            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl as string;
                return;
            }
            setIsSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            turnstileRef.current?.reset();
            setTurnstileToken(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (field: string) =>
        `submit-input w-full ${fieldErrors[field] ? '!border-[var(--accent-red)] !shadow-[0_0_0_3px_rgba(220,38,38,0.15)]' : ''}`;

    const scrollToForm = () => document.getElementById('submit-form')?.scrollIntoView({ behavior: 'smooth' });

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Hero */}
            <section className="submit-hero-bg relative overflow-hidden px-4 pt-20 pb-24 md:pt-28 md:pb-32">
                <div className="submit-hero-glow" aria-hidden />
                <div className="relative mx-auto max-w-3xl text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] md:text-5xl lg:text-6xl lg:leading-[1.1]">
                        Launch Your AI Tool on <span className="text-[var(--accent-primary)]">AiBDE</span>
                    </h1>
                    <p className="mt-5 text-lg text-[var(--text-secondary)] md:text-xl md:leading-relaxed">
                        Reach developers, founders, and businesses searching for the best AI tools.
                    </p>
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={scrollToForm}
                            className="submit-btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base"
                        >
                            Submit Your Tool
                            <ArrowRight className="h-5 w-5" />
                        </button>
                        <a href="#pricing" className="submit-btn-secondary inline-flex items-center gap-2 px-8 py-3.5 text-base">
                            View Featured Plans
                        </a>
                    </div>
                    <div className="mt-14 flex flex-wrap justify-center gap-4">
                        {['1000+ AI Tools Listed', 'Growing Global Directory', 'AI Builders Community'].map((label) => (
                            <span
                                key={label}
                                className="rounded-full border border-[var(--border-color)] bg-[var(--bg-card)]/80 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm backdrop-blur-sm"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trusted by */}
            <section className="border-b border-[var(--border-color)] px-4 py-14 md:py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Trusted by industry experts</h2>
                    <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
                        Professionals from leading tech companies use AiBDE to discover innovative tools.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                        {['Google', 'Microsoft', 'OpenAI', 'Meta', 'Amazon', 'NVIDIA', 'Adobe', 'IBM'].map((name) => (
                            <span key={name} className="text-sm font-medium text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]">
                                {name}
                            </span>
                        ))}
                    </div>
                    <p className="mt-6 text-xs text-[var(--text-tertiary)]">
                        Company names represent where AI professionals work and do not imply affiliation.
                    </p>
                </div>
            </section>

            {/* Platform stats */}
            <section className="border-b border-[var(--border-color)] px-4 py-14 md:py-20">
                <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
                    <StatCard value="1000+" label="AI Tools Listed" />
                    <StatCard value="350+" label="Categories" />
                    <StatCard value="50K+" label="Monthly Visitors" />
                </div>
            </section>

            {/* Recently submitted tools */}
            <section className="border-b border-[var(--border-color)] px-4 py-14 md:py-20">
                <div className="mx-auto max-w-6xl">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Recently submitted</h2>
                    <p className="mt-1 text-[15px] text-[var(--text-secondary)]">Join these tools on AiBDE</p>
                    <div className="mt-8 flex gap-5 overflow-x-auto pb-2">
                        {recentTools.length === 0 ? (
                            <div className="submit-card flex h-36 w-full min-w-[260px] items-center justify-center text-[var(--text-tertiary)]">
                                Loading…
                            </div>
                        ) : (
                            recentTools.map((t) => (
                                <Link
                                    key={t.id}
                                    href={t.appUsername ? `/app/${t.appUsername}` : '#'}
                                    className="submit-card flex min-w-[240px] max-w-[280px] shrink-0 flex-col p-5"
                                >
                                    <div className="flex items-center gap-3">
                                        {t.logoUrl ? (
                                            <img src={t.logoUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
                                        ) : (
                                            <div className="h-11 w-11 rounded-xl bg-[var(--bg-tertiary)]" />
                                        )}
                                        <span className="truncate font-semibold text-[var(--text-primary)]">{t.name}</span>
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">{t.summary || '—'}</p>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Why submit */}
            <section className="border-b border-[var(--border-color)] px-4 py-14 md:py-20">
                <div className="mx-auto max-w-5xl">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Why submit to AiBDE</h2>
                    <p className="mt-1 text-[15px] text-[var(--text-secondary)]">Get more visibility and credibility</p>
                    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <WhyCard
                            icon={BarChart3}
                            title="Traffic Exposure"
                            description="Reach thousands of AI users actively searching for tools."
                        />
                        <WhyCard
                            icon={Link2}
                            title="SEO Backlink"
                            description="Improve search visibility with a quality backlink."
                        />
                        <WhyCard
                            icon={Users}
                            title="AI Community"
                            description="Reach founders and developers in the AI space."
                        />
                        <WhyCard
                            icon={Bookmark}
                            title="Permanent Listing"
                            description="Your tool stays discoverable in our directory."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="border-b border-[var(--border-color)] px-4 py-14 md:py-20">
                <div className="mx-auto max-w-5xl">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Pricing plans</h2>
                    <p className="mt-1 text-[15px] text-[var(--text-secondary)]">Choose the right plan for your tool</p>
                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div
                            className={`submit-card p-6 transition-all ${
                                formData.plan === 'basic'
                                    ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]'
                                    : ''
                            }`}
                        >
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Free Listing</h3>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">$49</p>
                            <p className="text-sm text-[var(--text-tertiary)]">One-time</p>
                            <ul className="mt-5 space-y-3 text-[15px] text-[var(--text-secondary)]">
                                <li className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[var(--accent-primary)]" /> Basic listing</li>
                                <li className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[var(--accent-primary)]" /> Standard approval</li>
                            </ul>
                            <button
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, plan: 'basic' }))}
                                className="submit-btn-secondary mt-6 w-full py-3"
                            >
                                Select
                            </button>
                        </div>
                        <div
                            className={`submit-card relative p-6 transition-all ${
                                formData.plan === 'verified'
                                    ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]'
                                    : ''
                            }`}
                        >
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-primary)] px-3 py-1 text-xs font-semibold text-white shadow-md">
                                Most Popular
                            </span>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Featured Listing</h3>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--accent-primary)]">$99</p>
                            <p className="text-sm text-[var(--text-tertiary)]">One-time</p>
                            <ul className="mt-5 space-y-3 text-[15px] text-[var(--text-secondary)]">
                                <li className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[var(--accent-primary)]" /> Priority approval</li>
                                <li className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[var(--accent-primary)]" /> Featured placement</li>
                                <li className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[var(--accent-primary)]" /> Higher visibility</li>
                            </ul>
                            <button
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, plan: 'verified' }))}
                                className="submit-btn-primary mt-6 w-full py-3"
                            >
                                Select
                            </button>
                        </div>
                        <div
                            className={`submit-card p-6 transition-all ${
                                formData.plan === 'featured'
                                    ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]'
                                    : ''
                            }`}
                        >
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Premium Launch</h3>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)]">$249</p>
                            <p className="text-sm text-[var(--text-tertiary)]">One-time</p>
                            <ul className="mt-5 space-y-3 text-[15px] text-[var(--text-secondary)]">
                                <li className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[var(--accent-primary)]" /> Homepage feature</li>
                                <li className="flex items-center gap-2"><Check className="h-5 w-5 shrink-0 text-[var(--accent-primary)]" /> Maximum exposure</li>
                            </ul>
                            <button
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, plan: 'featured' }))}
                                className="submit-btn-secondary mt-6 w-full py-3"
                            >
                                Select
                            </button>
                        </div>
                    </div>
                    <p className="mt-6 text-center text-sm text-[var(--text-tertiary)]">
                        Limited featured spots available weekly.
                    </p>
                </div>
            </section>

            {/* Submission form */}
            <section id="submit-form" className="px-4 py-14 md:py-20">
                <div className="mx-auto max-w-3xl">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Submit your tool</h2>
                    <p className="mt-1 text-[15px] text-[var(--text-secondary)]">Your submission will be reviewed within 24–48 hours.</p>

                    {isSubmitted ? (
                        <div className="submit-card mt-10 border-[var(--accent-primary)]/30 bg-[var(--accent-primary-bg)] p-10 text-center">
                            <div className="result-success-icon mx-auto">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <h3 className="mt-6 text-xl font-semibold text-[var(--text-primary)]">Thank you</h3>
                            <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
                                Your tool <strong>{formData.toolName}</strong> has been sent for review.
                            </p>
                        </div>
                    ) : (
                        <div className="submit-card mt-10 p-6 md:p-10">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-[15px] font-medium text-[var(--text-secondary)]">Tool Name *</label>
                                        <input
                                            type="text"
                                            name="toolName"
                                            value={formData.toolName}
                                            onChange={handleChange}
                                            className={inputClass('toolName')}
                                            placeholder="My AI Tool"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-[15px] font-medium text-[var(--text-secondary)]">Website URL *</label>
                                        <input
                                            type="url"
                                            name="toolUrl"
                                            value={formData.toolUrl}
                                            onChange={handleChange}
                                            className={inputClass('toolUrl')}
                                            placeholder="https://myaitool.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-[15px] font-medium text-[var(--text-secondary)]">Short Description *</label>
                                    <input
                                        type="text"
                                        name="shortDescription"
                                        value={formData.shortDescription}
                                        onChange={handleChange}
                                        maxLength={160}
                                        className={inputClass('shortDescription')}
                                        placeholder="A brief one-liner about your tool"
                                    />
                                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">{formData.shortDescription.length}/160</p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-[15px] font-medium text-[var(--text-secondary)]">Pricing Model</label>
                                    <SearchableSelect
                                        value={formData.pricing}
                                        onChange={(v) => setFormData((p) => ({ ...p, pricing: v }))}
                                        options={PRICING_OPTIONS}
                                        placeholder="Select pricing"
                                        showSearch={false}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-[15px] font-medium text-[var(--text-secondary)]">Logo / Image URLs (one per line)</label>
                                    <textarea
                                        name="imageUrls"
                                        value={formData.imageUrls}
                                        onChange={handleChange}
                                        rows={2}
                                        className={inputClass('imageUrls')}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-[15px] font-medium text-[var(--text-secondary)]">Founder Email *</label>
                                    <input
                                        type="email"
                                        name="submitterEmail"
                                        value={formData.submitterEmail}
                                        onChange={handleChange}
                                        className={inputClass('submitterEmail')}
                                        placeholder="you@company.com"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-[15px] font-medium text-[var(--text-secondary)]">Your Name *</label>
                                    <input
                                        type="text"
                                        name="submitterName"
                                        value={formData.submitterName}
                                        onChange={handleChange}
                                        className={inputClass('submitterName')}
                                        placeholder="Jane Doe"
                                    />
                                </div>

                                {/* Live preview */}
                                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Listing preview</p>
                                    <div className="flex items-start gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-tertiary)]">
                                            {formData.imageUrls.trim() ? (
                                                <img
                                                    src={formData.imageUrls.split('\n')[0].trim()}
                                                    alt=""
                                                    className="h-12 w-12 object-cover"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            ) : null}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-[var(--text-primary)]">{formData.toolName || 'Tool name'}</div>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">
                                                {formData.shortDescription || 'Short description will appear here.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
                                    <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={agreedToGuidelines}
                                            onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                                            className="mt-0.5 h-5 w-5 rounded-md border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-0"
                                        />
                                        <span className="text-[15px] text-[var(--text-secondary)]">
                                            I have read and agree to the submission guidelines. I confirm my tool is publicly accessible and does not contain NSFW content.
                                        </span>
                                    </label>
                                </div>

                                <div className="flex justify-center">
                                    <Turnstile
                                        ref={turnstileRef}
                                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                                        onSuccess={(token) => setTurnstileToken(token)}
                                        onError={() => setTurnstileToken(null)}
                                        onExpire={() => setTurnstileToken(null)}
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-3 rounded-xl border border-[var(--accent-red)]/30 bg-[var(--accent-red-bg)] p-4 text-[15px] text-[var(--accent-red)]">
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !agreedToGuidelines || !turnstileToken}
                                    className="submit-btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Submitting…
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            Submit Your Tool
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-[var(--text-tertiary)]">
                                    By submitting you agree to our <Link href="/terms" className="text-[var(--accent-primary)] hover:underline">Terms</Link>.
                                </p>
                            </form>
                        </div>
                    )}
                </div>
            </section>

            {/* Testimonials */}
            <section className="border-b border-[var(--border-color)] px-4 py-14 md:py-20">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">What founders say</h2>
                    <div className="mt-10 grid gap-6 sm:grid-cols-2">
                        <div className="submit-card p-6 sm:p-8">
                            <p className="text-[17px] leading-relaxed text-[var(--text-secondary)]">"AiBDE helped us reach early AI adopters."</p>
                            <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">— AI tool founder</p>
                        </div>
                        <div className="submit-card p-6 sm:p-8">
                            <p className="text-[17px] leading-relaxed text-[var(--text-secondary)]">"Our AI tool gained visibility after listing on AiBDE."</p>
                            <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">— Startup founder</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="border-b border-[var(--border-color)] px-4 py-14 md:py-20">
                <div className="mx-auto max-w-2xl">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">FAQ</h2>
                    <div className="submit-card mt-8 px-5">
                        <FAQAccordion question="How long does approval take?">
                            Your submission will be reviewed within 24–48 hours for paid plans. Free listings may take longer. We'll notify you by email once your tool is live.
                        </FAQAccordion>
                        <FAQAccordion question="Can I update my listing later?">
                            Yes. Email support@aibde.tech with your tool name and the changes you'd like. We'll update the listing within 24–48 hours.
                        </FAQAccordion>
                        <FAQAccordion question="Do you offer featured placements?">
                            Yes. We offer Featured and Premium Launch plans for priority placement, homepage visibility, and maximum exposure.
                        </FAQAccordion>
                        <FAQAccordion question="Is there a free listing option?">
                            Yes. Our Free Listing plan gives you a basic listing with standard approval. Paid plans offer priority review and enhanced visibility.
                        </FAQAccordion>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="submit-hero-bg relative px-4 py-20 md:py-28">
                <div className="submit-hero-glow opacity-60" aria-hidden />
                <div className="relative mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] md:text-4xl">
                        Launch your AI tool today
                    </h2>
                    <p className="mt-4 text-lg text-[var(--text-secondary)]">
                        Join the growing AI ecosystem on AiBDE.
                    </p>
                    <button
                        type="button"
                        onClick={scrollToForm}
                        className="submit-btn-primary mt-10 inline-flex items-center gap-2 px-10 py-4 text-base"
                    >
                        Submit Your Tool
                        <Sparkles className="h-5 w-5" />
                    </button>
                </div>
            </section>
        </div>
    );
}

function SubmitPageInner() {
    const searchParams = useSearchParams();
    const isPreview = searchParams.get('preview') === 'success';
    return <SubmitPageContent isPreview={isPreview} />;
}

export default function SubmitPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[60vh] items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
                    Loading…
                </div>
            }
        >
            <SubmitPageInner />
        </Suspense>
    );
}
