'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    Compass,
    Crown,
    Eye,
    Globe2,
    Image as ImageIcon,
    LayoutDashboard,
    Loader2,
    Rocket,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    TrendingUp,
    Upload,
    Users,
} from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VerifiedBadge, FeaturedBadge, ToolBadge, CloseIcon } from '@/components/icons';

interface FormData {
    submitterName: string;
    submitterEmail: string;
    toolName: string;
    toolUrl: string;
    shortDescription: string;
    pricing: string;
    category: string;
    customCategory: string;
    plan: 'basic' | 'verified' | 'featured';
}

interface RecentTool {
    id: string;
    name: string;
    appUsername?: string;
    logoUrl?: string | null;
    summary?: string | null;
    listingType?: string;
    isFeatured?: boolean;
}

const PRICING_OPTIONS = [
    { value: 'free', label: 'Free' },
    { value: 'freemium', label: 'Freemium' },
    { value: 'paid', label: 'Paid' },
    { value: 'free_trial', label: 'Free Trial' },
    { value: 'open_source', label: 'Open Source' },
];

const CATEGORY_OPTIONS = [
    { value: 'ai-assistant', label: 'AI Assistant' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'developer-tools', label: 'Developer Tools' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'design', label: 'Design' },
    { value: 'automation', label: 'Automation' },
    { value: 'video', label: 'Video' },
    { value: 'research', label: 'Research' },
    { value: 'other', label: 'Other' },
];

const PLANS = [
    {
        id: 'basic' as const,
        name: 'Basic',
        price: '$49',
        tickColor: '',
        description: 'Standard directory listing',
        features: [
            'Permanent directory listing',
            'Category & task placement',
            'Basic SEO indexing',
            'Email support',
        ],
    },
    {
        id: 'verified' as const,
        name: 'Verified',
        price: '$99',
        badge: 'Most Popular',
        tickColor: 'text-blue-500',
        description: 'Blue tick verified listing',
        features: [
            'Everything in Basic',
            'Priority 24h review',
            'Blue verified badge ✓',
            'Enhanced SEO placement',
            'Social media mention',
        ],
    },
    {
        id: 'featured' as const,
        name: 'Featured',
        price: '$249',
        tickColor: 'text-yellow-500',
        description: 'Gold tick + maximum exposure',
        features: [
            'Everything in Verified',
            'Gold verified badge ✓',
            '3-day homepage Featured placement',
            'Newsletter feature',
            'Priority category ranking',
            'Dedicated support',
            'Analytics dashboard access',
        ],
    },
];

const FOUNDER_REVIEWS = [
    {
        name: 'Sarah Chen',
        role: 'Founder, CodePilot AI',
        quote: 'AiBDE drove consistent organic traffic to our tool page from day one. Best ROI for any directory listing.',
    },
    {
        name: 'Marcus Rivera',
        role: 'CEO, DataForge',
        quote: 'The SEO benefits alone justified the investment. We rank for keywords we never targeted before.',
    },
    {
        name: 'Priya Sharma',
        role: 'Co-founder, WriteFlow',
        quote: 'Submitting was effortless and the review was thorough. Our listing went live within 24 hours.',
    },
];

function Counter({ end, suffix, label }: { end: number; suffix?: string; label: string }) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let raf = 0;
        const start = performance.now();
        const duration = 1000;

        function run(now: number): void {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(end * eased));
            if (progress < 1) raf = requestAnimationFrame(run);
        }

        raf = requestAnimationFrame(run);
        return () => cancelAnimationFrame(raf);
    }, [end]);

    return (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {value.toLocaleString()}
                {suffix || ''}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{label}</p>
        </div>
    );
}

function FAQItem({ question, children }: { question: string; children: React.ReactNode }) {
    return (
        <details className="group border-b border-[var(--border-color)] last:border-none">
            <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[15px] font-semibold text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)] transition group-open:rotate-180" />
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</p>
        </details>
    );
}

function ToolCardSkeleton() {
    return (
        <div className="min-w-[260px] max-w-[290px] flex-shrink-0 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3">
                <div className="skeleton h-10 w-10 rounded-lg" />
                <div className="skeleton h-4 w-24 rounded" />
            </div>
            <div className="mt-3 space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
            </div>
        </div>
    );
}

function MarqueeToolCards({ tools }: { tools: RecentTool[] }) {
    const doubled = [...tools, ...tools];

    return (
        <div className="submit-marquee-wrapper">
            <div className="submit-marquee">
                {doubled.map((tool, i) => (
                    <Link
                        key={`${tool.id}-${i}`}
                        href={tool.appUsername ? `/app/${tool.appUsername}` : '#'}
                        className="min-w-[260px] max-w-[290px] flex-shrink-0 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40"
                    >
                        <div className="flex items-center gap-3">
                            {tool.logoUrl ? (
                                <img src={tool.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)]">
                                    <ImageIcon className="h-5 w-5 text-[var(--text-tertiary)]" />
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{tool.name}</p>
                                <ToolBadge listingType={tool.listingType} isFeatured={tool.isFeatured} size={14} />
                            </div>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-[var(--text-secondary)]">
                            {tool.summary || 'AI tool listed on AiBDE.'}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function SubmitPageContent({ isPreview }: { isPreview: boolean }) {
    const [formData, setFormData] = useState<FormData>({
        submitterName: '',
        submitterEmail: '',
        toolName: '',
        toolUrl: '',
        shortDescription: '',
        pricing: '',
        category: '',
        customCategory: '',
        plan: 'verified',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(isPreview);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
    const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [localLogoPreview, setLocalLogoPreview] = useState('');
    const [logoFileName, setLogoFileName] = useState('');
    const [recentTools, setRecentTools] = useState<RecentTool[]>([]);
    const [toolsLoading, setToolsLoading] = useState(true);
    const [toolCount, setToolCount] = useState(0);
    const [categoryCount, setCategoryCount] = useState(0);
    const [taskCount, setTaskCount] = useState(0);

    const turnstileRef = useRef<TurnstileInstance>(null);
    const logoFileRef = useRef<File | null>(null);

    useEffect(() => {
        setToolsLoading(true);
        fetch('/api/public/tools?limit=8')
            .then((r) => r.json())
            .then((d) => setRecentTools(d.data || []))
            .catch(() => {})
            .finally(() => setToolsLoading(false));

        // Same count functions used by the homepage
        fetch('/api/public/stats')
            .then((r) => r.json())
            .then((d) => {
                if (d.tools) setToolCount(d.tools);
                if (d.categories) setCategoryCount(d.categories);
                if (d.tasks) setTaskCount(d.tasks);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        return () => {
            if (localLogoPreview) URL.revokeObjectURL(localLogoPreview);
        };
    }, [localLogoPreview]);

    const inputClass = useCallback(
        (field: string) =>
            `submit-input w-full ${fieldErrors[field] ? '!border-[var(--accent-red)] !shadow-[0_0_0_3px_rgba(220,38,38,0.15)]' : ''}`,
        [fieldErrors],
    );

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
        if (value) setFieldErrors((prev) => ({ ...prev, [name]: false }));
    }

    function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>): void {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setLocalLogoPreview(objectUrl);
        setLogoFileName(file.name);
        logoFileRef.current = file;
    }

    async function handleSubmit(e: React.FormEvent): Promise<void> {
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
        if (!formData.category) errors.category = true;
        if (!formData.pricing) errors.pricing = true;
        if (formData.category === 'other' && !formData.customCategory) errors.customCategory = true;

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
            // Upload logo to R2 first (if selected)
            let logoUrl: string | null = null;
            if (logoFileRef.current) {
                const logoFormData = new FormData();
                logoFormData.append('file', logoFileRef.current);
                const logoRes = await fetch('/api/public/upload-logo', {
                    method: 'POST',
                    body: logoFormData,
                });
                if (logoRes.ok) {
                    const logoResult = await logoRes.json();
                    logoUrl = logoResult.path;
                }
            }

            const baseUrl = window.location.origin;
            const response = await fetch('/api/submit-tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    description: formData.shortDescription,
                    tags: formData.category,
                    customCategory: formData.category === 'other' ? formData.customCategory : undefined,
                    socialLinks: [],
                    logoUrl,
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
    }

    function scrollToForm(): void {
        document.getElementById('submit-form')?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden border-b border-[var(--border-color)] px-4 pt-16 pb-14 md:pt-24 md:pb-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,178,123,0.12),transparent_45%)]" />
                <div className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                            AiBDE Tool Launch Portal
                        </p>
                        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[var(--text-primary)] md:text-5xl lg:text-6xl lg:leading-[1.05]">
                            Launch Your AI Tool on AiBDE
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
                            Reach developers, founders, and businesses actively looking for innovative AI products.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <button type="button" onClick={scrollToForm} className="submit-btn-primary inline-flex items-center gap-2 px-7 py-3.5">
                                Submit Your Tool
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <a href="#proof" className="submit-btn-secondary inline-flex items-center gap-2 px-7 py-3.5">
                                Why Founders Choose AiBDE
                            </a>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-2">
                            {[`${toolCount.toLocaleString()}+ AI Tools Listed`, 'Growing Global AI Directory', 'AI Builders Community'].map((pill) => (
                                <span key={pill} className="rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                                    {pill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-lg">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Launch Snapshot</p>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <Counter end={toolCount} suffix="+" label="Tools listed" />
                            <Counter end={categoryCount} suffix="" label="Categories" />
                            <Counter end={taskCount} suffix="+" label="Tasks covered" />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <Counter end={50} suffix="K+" label="Monthly visitors" />
                            <Counter end={195} suffix="+" label="Countries" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Why Founders Choose AiBDE ── */}
            <section id="proof" className="border-b border-[var(--border-color)] px-4 py-14">
                <div className="mx-auto max-w-6xl">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Why Founders Choose AiBDE</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Everything you need to grow your AI tool&apos;s reach.</p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                            <Globe2 className="h-5 w-5 text-[var(--accent-primary)]" />
                            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">Global Discovery</h3>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                Your tool gets seen by users in 195+ countries searching for AI solutions across {categoryCount} categories and {taskCount.toLocaleString()}+ tasks.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                            <Eye className="h-5 w-5 text-[var(--accent-primary)]" />
                            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">Visibility That Lasts</h3>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                Your listing stays discoverable in directory search and browsing experiences — not a one-day spike.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                            <ShieldCheck className="h-5 w-5 text-[var(--accent-primary)]" />
                            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">Manual Review</h3>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                Each submission is reviewed for quality and fit so users trust the directory.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                            <Search className="h-5 w-5 text-[var(--accent-primary)]" />
                            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">SEO-Optimized Listings</h3>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                Each listing is structured with rich metadata, FAQ schema, and semantic markup for maximum search visibility.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                            <LayoutDashboard className="h-5 w-5 text-[var(--accent-primary)]" />
                            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">Founder Dashboard</h3>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                Track views, clicks, and engagement on your listing through a dedicated analytics dashboard.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                            <TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" />
                            <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">Growing Community</h3>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                Join {toolCount.toLocaleString()}+ AI tools already listed and benefit from an ever-expanding audience of AI enthusiasts.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Founder Reviews ── */}
            <section className="border-b border-[var(--border-color)] px-4 py-14">
                <div className="mx-auto max-w-6xl">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">What Founders Say</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Hear from builders who launched on AiBDE.</p>

                    <div className="mt-6 grid gap-5 md:grid-cols-3">
                        {FOUNDER_REVIEWS.map((review) => (
                            <div key={review.name} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-[var(--accent-yellow)] text-[var(--accent-yellow)]" />
                                    ))}
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] italic">
                                    &ldquo;{review.quote}&rdquo;
                                </p>
                                <div className="mt-4 border-t border-[var(--border-color)] pt-3">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{review.name}</p>
                                    <p className="text-xs text-[var(--text-tertiary)]">{review.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Recently Submitted Tools (Auto-scroll Marquee) ── */}
            <section className="border-b border-[var(--border-color)] px-4 py-14">
                <div className="mx-auto max-w-6xl">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Recently Submitted Tools</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Social proof from builders already launching on AiBDE.</p>

                    <div className="mt-6">
                        {toolsLoading ? (
                            <div className="flex gap-4 overflow-hidden">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <ToolCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : recentTools.length === 0 ? (
                            <div className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-sm text-[var(--text-tertiary)]">
                                No recent submissions yet.
                            </div>
                        ) : (
                            <MarqueeToolCards tools={recentTools} />
                        )}
                    </div>
                </div>
            </section>

            {/* ── Pricing Plans ── */}
            <section id="pricing" className="border-b border-[var(--border-color)] px-4 py-14">
                <div className="mx-auto max-w-6xl">
                    <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)]">Choose Your Plan</h2>
                    <p className="mt-1 text-center text-sm text-[var(--text-secondary)]">
                        Every plan includes a permanent listing in the AiBDE directory.
                    </p>

                    <div className="mt-8 grid gap-5 md:grid-cols-3">
                        {PLANS.map((plan) => {
                            const isSelected = formData.plan === plan.id;
                            return (
                                <button
                                    key={plan.id}
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, plan: plan.id }))}
                                    className={`group relative flex flex-col rounded-2xl border-2 p-6 text-left transition ${
                                        isSelected
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-bg)]'
                                            : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/60'
                                    }`}
                                >
                                    {plan.badge && (
                                        <span className="absolute -top-3 right-4 rounded-full bg-[var(--accent-primary)] px-3 py-0.5 text-xs font-bold text-white">
                                            {plan.badge}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-[var(--text-secondary)]">{plan.name}</p>
                                        {plan.id === 'verified' && <VerifiedBadge size={14} />}
                                        {plan.id === 'featured' && <FeaturedBadge size={14} />}
                                    </div>
                                    <p className="mt-1 text-3xl font-extrabold text-[var(--text-primary)]">
                                        {plan.price}
                                        <span className="text-sm font-normal text-[var(--text-tertiary)]"> one-time</span>
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{plan.description}</p>
                                    <ul className="mt-4 flex-1 space-y-2">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    {isSelected ? (
                                        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            Selected
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex items-center justify-center rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-tertiary)] opacity-0 transition group-hover:opacity-100 group-hover:border-[var(--accent-primary)] group-hover:text-[var(--accent-primary)]">
                                            Select {plan.name}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Launch */}
                    <div className="mt-6 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <Crown className="h-5 w-5 text-[var(--accent-yellow)]" />
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">Custom Launch</h3>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                            Need a tailored launch strategy, custom placement, or bulk submissions? We&apos;ll create a plan that fits your goals.
                        </p>
                        <a
                            href="mailto:support@aibde.tech?subject=Custom Launch Inquiry"
                            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)] hover:text-white"
                        >
                            Contact Us
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Submit Form ── */}
            <section id="submit-form" className="px-4 py-14 md:py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 md:p-8">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Submit Your Tool</h2>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">Your submission is typically reviewed within 24–48 hours.</p>
                            </div>

                            {isSubmitted ? (
                                <div className="rounded-2xl border border-[var(--accent-primary)]/30 bg-[var(--accent-primary-bg)] p-8 text-center">
                                    <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--accent-primary)]" />
                                    <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Submission captured</h3>
                                    <p className="mt-2 text-sm text-[var(--text-secondary)]">Your tool has been sent for review.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Tool Name *</label>
                                            <input name="toolName" value={formData.toolName} onChange={handleChange} className={inputClass('toolName')} placeholder="My AI Tool" />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Website URL *</label>
                                            <input name="toolUrl" value={formData.toolUrl} onChange={handleChange} className={inputClass('toolUrl')} placeholder="https://myaitool.com" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Short Description *</label>
                                        <textarea
                                            name="shortDescription"
                                            maxLength={160}
                                            rows={2}
                                            value={formData.shortDescription}
                                            onChange={handleChange}
                                            className={`${inputClass('shortDescription')} resize-none`}
                                            placeholder="Describe your tool in one sentence"
                                        />
                                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">{formData.shortDescription.length}/160</p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Category *</label>
                                            <SearchableSelect
                                                value={formData.category}
                                                onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                                                options={CATEGORY_OPTIONS}
                                                placeholder="Select category"
                                                showSearch={false}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Pricing Model *</label>
                                            <SearchableSelect
                                                value={formData.pricing}
                                                onChange={(value) => setFormData((prev) => ({ ...prev, pricing: value }))}
                                                options={PRICING_OPTIONS}
                                                placeholder="Select pricing"
                                                showSearch={false}
                                            />
                                        </div>
                                    </div>

                                    {formData.category === 'other' && (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Custom Category Name *</label>
                                            <input
                                                name="customCategory"
                                                value={formData.customCategory}
                                                onChange={handleChange}
                                                className={inputClass('customCategory')}
                                                placeholder="e.g. Healthcare AI, Legal AI, etc."
                                            />
                                        </div>
                                    )}

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Founder Email *</label>
                                            <input name="submitterEmail" value={formData.submitterEmail} onChange={handleChange} className={inputClass('submitterEmail')} placeholder="you@company.com" />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Your Name *</label>
                                            <input name="submitterName" value={formData.submitterName} onChange={handleChange} className={inputClass('submitterName')} placeholder="Jane Doe" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Logo Upload</label>
                                        <label className={`submit-input flex cursor-pointer items-center gap-3 text-[var(--text-secondary)] hover:border-[var(--accent-primary)] ${localLogoPreview ? '!border-[var(--accent-primary)]/40' : ''}`}>
                                            {localLogoPreview ? (
                                                <>
                                                    <img src={localLogoPreview} alt="" className="h-8 w-8 rounded-md object-cover" />
                                                    <span className="flex-1 truncate text-sm text-[var(--text-primary)]">{logoFileName}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.preventDefault(); setLocalLogoPreview(''); setLogoFileName(''); }}
                                                        className="rounded-full p-0.5 hover:bg-[var(--bg-secondary)]"
                                                    >
                                                        <CloseIcon size={14} className="text-[var(--text-tertiary)] hover:text-[var(--accent-red)]" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4" />
                                                    Upload file
                                                </>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                        </label>
                                    </div>

                                    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                                        <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                                            <input
                                                type="checkbox"
                                                checked={agreedToGuidelines}
                                                onChange={(e) => setAgreedToGuidelines(e.target.checked)}
                                                className="mt-0.5 h-4 w-4 rounded border-[var(--border-color)]"
                                            />
                                            I agree to the submission guidelines and confirm the tool is publicly accessible and not NSFW.
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
                                        <div className="flex items-center gap-2 rounded-xl border border-[var(--accent-red)]/30 bg-[var(--accent-red-bg)] p-3 text-sm text-[var(--accent-red)]">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex justify-center">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !agreedToGuidelines || !turnstileToken}
                                            className="submit-btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Rocket className="h-4 w-4" />
                                                    Pay and Launch
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <p className="text-center text-xs text-[var(--text-tertiary)]">
                                        By submitting, you agree to our <Link href="/terms" className="text-[var(--accent-primary)] hover:underline">Terms</Link>.
                                    </p>
                                </form>
                            )}
                        </div>

                        <div className="space-y-5">
                            {/* Listing Preview */}
                            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">Listing Preview</p>
                                <div className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-card)]">
                                            {localLogoPreview ? (
                                                <img
                                                    src={localLogoPreview}
                                                    alt=""
                                                    className="h-12 w-12 object-cover"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <ImageIcon className="h-6 w-6 text-[var(--text-tertiary)]" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1">
                                                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                                    {formData.toolName || 'Tool name'}
                                                </p>
                                                {formData.plan === 'verified' && <VerifiedBadge size={14} />}
                                                {formData.plan === 'featured' && <FeaturedBadge size={14} />}
                                            </div>
                                            <p className="mt-1 line-clamp-2 break-words text-xs text-[var(--text-secondary)]">
                                                {formData.shortDescription || 'Short description appears here.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Selected Plan */}
                            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">Selected Plan</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <Crown className="h-5 w-5 text-[var(--accent-primary)]" />
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                            {PLANS.find((p) => p.id === formData.plan)?.name || 'Pro'} Plan
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {PLANS.find((p) => p.id === formData.plan)?.price || '$79'} one-time
                                        </p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="mt-3 text-xs font-medium text-[var(--accent-primary)] hover:underline">
                                    Change plan ↑
                                </button>
                            </div>

                            {/* What Happens Next */}
                            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">What Happens Next</p>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-start gap-3 rounded-xl border border-[var(--border-color)] p-3">
                                        <Compass className="mt-0.5 h-4 w-4 text-[var(--accent-primary)]" />
                                        <div>
                                            <p className="text-sm font-medium text-[var(--text-primary)]">Editorial Review</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Our team checks quality, category fit, and submission completeness.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-xl border border-[var(--border-color)] p-3">
                                        <Users className="mt-0.5 h-4 w-4 text-[var(--accent-primary)]" />
                                        <div>
                                            <p className="text-sm font-medium text-[var(--text-primary)]">Directory Publish</p>
                                            <p className="text-xs text-[var(--text-secondary)]">Approved tools appear in the AiBDE directory and category/task discovery.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-xl border border-[var(--border-color)] p-3">
                                        <Rocket className="mt-0.5 h-4 w-4 text-[var(--accent-primary)]" />
                                        <div>
                                            <p className="text-sm font-medium text-[var(--text-primary)]">Founder Notification</p>
                                            <p className="text-xs text-[var(--text-secondary)]">You get status updates by email as your listing is processed.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="border-b border-[var(--border-color)] px-4 py-14">
                <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] px-6 md:px-8">
                    <h2 className="pt-6 text-2xl font-bold tracking-tight text-[var(--text-primary)]">Frequently Asked Questions</h2>
                    <div className="mt-3">
                        <FAQItem question="How long does approval take?">Most submissions are reviewed within 24–48 hours for paid plans. Free listings may take longer. We&apos;ll notify you by email once your tool is live.</FAQItem>
                        <FAQItem question="Can I edit my listing later?">Yes. Email support@aibde.tech with your tool name and the changes you&apos;d like. We&apos;ll update the listing within 24–48 hours.</FAQItem>
                        <FAQItem question="Do you offer featured placements?">Yes! Our Featured plan ($249) gives you homepage visibility, newsletter features, and priority category ranking for maximum exposure.</FAQItem>
                        <FAQItem question="Is there a free listing option?">We currently offer three paid plans starting at $49. Each plan ensures manual review and a permanent listing in our directory.</FAQItem>
                        <FAQItem question="What&apos;s the difference between Basic, Verified, and Featured?">Basic ($49) gets you listed with standard SEO. Verified ($99) adds a blue verified badge, priority review, and social mention. Featured ($249) includes a gold badge, 3-day homepage placement, newsletter feature, and analytics access.</FAQItem>
                        <FAQItem question="Can I get a refund?">If your tool is not approved after review, we offer a full refund. Contact support@aibde.tech for assistance.</FAQItem>
                        <FAQItem question="What categories do you support?">We support AI Assistant, Productivity, Developer Tools, Marketing, Design, Automation, Video, Research, and more. If your tool doesn&apos;t fit, select &quot;Other&quot; and specify your category.</FAQItem>
                        <FAQItem question="How does AiBDE help with SEO?">Every listing gets a dedicated page with structured data, FAQ schema, meta tags, and internal linking — helping your tool rank in Google search results.</FAQItem>
                        <FAQItem question="Do you verify the tools you list?">Yes. Our editorial team manually reviews each submission for quality, functionality, and relevance before it goes live.</FAQItem>
                        <FAQItem question="Can I submit multiple tools?">Absolutely! Each tool requires a separate submission and plan. Volume discounts are available — contact support@aibde.tech.</FAQItem>
                    </div>
                </div>
            </section>

            {/* ── Bottom CTA ── */}
            <section className="px-4 py-16 md:py-20">
                <div className="mx-auto max-w-4xl rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] md:text-4xl">Launch your AI tool today.</h2>
                    <p className="mt-3 text-sm text-[var(--text-secondary)] md:text-base">Join the growing community of AI builders on AiBDE.</p>
                    <button type="button" onClick={scrollToForm} className="submit-btn-primary mt-8 inline-flex items-center gap-2 px-8 py-3.5">
                        Submit Your Tool
                        <Sparkles className="h-4 w-4" />
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
