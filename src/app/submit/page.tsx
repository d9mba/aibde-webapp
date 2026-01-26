'use client';

import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Loader2, CheckCircle, AlertCircle, Info, Plus, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const PRICING_OPTIONS = [
    { value: 'free', label: 'Free' },
    { value: 'freemium', label: 'Freemium' },
    { value: 'paid', label: 'Paid' },
    { value: 'free_trial', label: 'Free Trial' },
    { value: 'open_source', label: 'Open Source' },
];

const SOCIAL_PLATFORMS = [
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'discord', label: 'Discord' },
    { value: 'github', label: 'GitHub' },
    { value: 'other', label: 'Other' },
];

interface SocialLink {
    platform: string;
    url: string;
}

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
    socialLinks: SocialLink[];
    imageUrls: string;
    videoUrls: string;
}

// Main content component that receives isPreview as prop
function SubmitToolContent({ isPreview }: { isPreview: boolean }) {
    const [formData, setFormData] = useState<FormData>({
        submitterName: isPreview ? '{Name}' : '',
        submitterEmail: isPreview ? '{Email}' : '',
        toolName: isPreview ? '{ToolName}' : '',
        toolUrl: '',

        shortDescription: '',
        longDescription: '',
        pricing: '',
        releasedDate: '',
        tags: '',
        features: '',
        hasAffiliateProgram: false,
        affiliateUrl: '',
        socialLinks: [{ platform: 'twitter', url: '' }],
        imageUrls: '',
        videoUrls: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(isPreview);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
    const turnstileRef = useRef<TurnstileInstance>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setError('');
        if (value) setFieldErrors(prev => ({ ...prev, [name]: false }));
    };

    const addSocialLink = () => {
        setFormData(prev => ({
            ...prev,
            socialLinks: [...prev.socialLinks, { platform: 'twitter', url: '' }]
        }));
    };

    const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
        setFormData(prev => {
            const links = [...prev.socialLinks];
            links[index] = { ...links[index], [field]: value };
            return { ...prev, socialLinks: links };
        });
    };

    const removeSocialLink = (index: number) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter((_, i) => i !== index)
        }));
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
            const response = await fetch('/api/submit-tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, description: formData.shortDescription, turnstileToken }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Submission failed');
            setIsSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            turnstileRef.current?.reset();
            setTurnstileToken(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (field: string) => `w-full px-3 py-2 bg-bg-secondary border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary ${fieldErrors[field] ? 'border-accent-red' : 'border-border'}`;

    return (
        <div className="max-w-[800px] mx-auto px-4 py-8">
            {/* Promotional Notice */}
            <div className="mb-6 p-4 bg-accent-green/10 border border-accent-green/30 rounded-lg">
                <p className="text-sm text-text-primary">
                    🎉 <strong>Limited Time Offer:</strong> We are currently accepting <strong>free submissions</strong>! Approval is subject to review.
                </p>
                <p className="text-sm text-text-secondary mt-1">
                    For fast-track listings, email us at <a href="mailto:support@aibde.tech" className="text-accent-primary font-medium hover:underline">support@aibde.tech</a>
                </p>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text-primary mb-1">Submit Your AI Tool</h1>
                <p className="text-text-secondary text-sm">Get listed in our directory for free</p>
            </div>

            {/* Success Message OR Form */}
            {isSubmitted ? (
                <div className="max-w-[600px] mx-auto text-center p-8 bg-bg-card border border-accent-green/30 rounded-xl mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-green/10 text-accent-green mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">Thank You!</h2>
                    <p className="text-text-secondary mb-1">
                        Thanks for submitting, <span className="font-medium text-text-primary">{formData.submitterName}</span>!
                    </p>
                    <p className="text-text-secondary mb-1">
                        Your tool <span className="font-medium text-text-primary">{formData.toolName}</span> has been sent for review.
                    </p>
                    <p className="text-text-tertiary text-sm mt-3">
                        Free submissions may take up to a week or more. For fast-track review, email us at{' '}
                        <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a>
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Your Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Your Name <span className="text-accent-red">*</span></label>
                            <input type="text" name="submitterName" value={formData.submitterName} onChange={handleChange} className={inputClass('submitterName')} placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Email <span className="text-accent-red">*</span></label>
                            <input type="email" name="submitterEmail" value={formData.submitterEmail} onChange={handleChange} className={inputClass('submitterEmail')} placeholder="john@example.com" />
                        </div>
                    </div>

                    {/* Tool Basic */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Tool Name <span className="text-accent-red">*</span></label>
                            <input type="text" name="toolName" value={formData.toolName} onChange={handleChange} className={inputClass('toolName')} placeholder="My AI Tool" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Website URL <span className="text-accent-red">*</span></label>
                            <input type="url" name="toolUrl" value={formData.toolUrl} onChange={handleChange} className={inputClass('toolUrl')} placeholder="https://myaitool.com" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Released Date</label>
                            <input type="date" name="releasedDate" value={formData.releasedDate} onChange={handleChange} className={inputClass('releasedDate')} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Short Description <span className="text-accent-red">*</span></label>
                        <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleChange} maxLength={160} className={inputClass('shortDescription')} placeholder="A brief one-liner about your tool" />
                        <p className="text-xs text-text-tertiary mt-1">{formData.shortDescription.length}/160</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Pricing</label>
                        <SearchableSelect value={formData.pricing} onChange={(val) => setFormData(prev => ({ ...prev, pricing: val }))}
                            options={PRICING_OPTIONS} placeholder="Select pricing" showSearch={false} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Full Description</label>
                        <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} rows={8} className={`${inputClass('longDescription')} resize-none`} placeholder="Describe your tool in detail. Include everything about it in 1000 words - features, use cases, benefits, target audience, how it works, etc." />
                        <p className="text-xs text-text-tertiary mt-1">{formData.longDescription.split(/\s+/).filter(Boolean).length} words</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Tags (comma separated)</label>
                        <input type="text" name="tags" value={formData.tags} onChange={handleChange} className={inputClass('tags')} placeholder="ai, writing, productivity" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Key Features (one per line)</label>
                        <textarea name="features" value={formData.features} onChange={handleChange} rows={3} className={`${inputClass('features')} resize-none`} placeholder="• AI-powered writing&#10;• Multiple language support&#10;• Chrome extension" />
                    </div>

                    {/* Affiliate Program */}
                    <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="hasAffiliateProgram" checked={formData.hasAffiliateProgram} onChange={handleChange} className="w-4 h-4 rounded border-border bg-bg-tertiary text-accent-primary" />
                            <span className="text-sm font-medium text-text-primary">Does your tool have an affiliate program?</span>
                        </label>
                        {formData.hasAffiliateProgram && (
                            <div className="mt-3">
                                <input type="url" name="affiliateUrl" value={formData.affiliateUrl} onChange={handleChange} className={inputClass('affiliateUrl')} placeholder="https://myaitool.com/affiliate" />
                            </div>
                        )}
                    </div>

                    {/* Social Media Links */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-text-secondary">Social Media Links</label>
                            <button type="button" onClick={addSocialLink} className="flex items-center gap-1 px-3 py-1 bg-accent-green/10 text-accent-green rounded-lg text-sm font-medium hover:bg-accent-green/20 transition-colors">
                                <Plus className="w-4 h-4" /> Add Link
                            </button>
                        </div>
                        {formData.socialLinks.length === 0 && (
                            <p className="text-xs text-text-tertiary">No social links added. Click &quot;Add Link&quot; to add one.</p>
                        )}
                        <div className="space-y-2">
                            {formData.socialLinks.map((link, index) => (
                                <div key={index} className="flex gap-2">
                                    <SearchableSelect
                                        value={link.platform}
                                        onChange={(val) => updateSocialLink(index, 'platform', val)}
                                        options={SOCIAL_PLATFORMS}
                                        showSearch={false}
                                        className="w-32"
                                    />
                                    <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                        className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary"
                                        placeholder="https://..."
                                    />
                                    <button type="button" onClick={() => removeSocialLink(index)} className="p-2 text-text-tertiary hover:text-accent-red">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Images & Videos */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Add Logo & Screenshot URLs (one per line)</label>
                        <textarea name="imageUrls" value={formData.imageUrls} onChange={handleChange} rows={3} className={`${inputClass('imageUrls')} resize-none`} placeholder="https://aibde.tech/images..." />
                        <p className="text-xs text-text-tertiary mt-1">You may add tool logo, app images, or homepage screenshots</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Add Videos (one per line)</label>
                        <textarea name="videoUrls" value={formData.videoUrls} onChange={handleChange} rows={2} className={`${inputClass('videoUrls')} resize-none`} placeholder="https://youtube.com/watch?v=..." />
                        <p className="text-xs text-text-tertiary mt-1">YouTube, Vimeo, or any other video URL</p>
                    </div>

                    {/* Guidelines & Submit */}
                    <div className="pt-4 border-t border-border space-y-4">
                        <div className="p-4 bg-bg-secondary rounded-lg">
                            <div className="flex items-start gap-2 mb-3">
                                <Info className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                                <h3 className="text-sm font-semibold text-text-primary">Submission Guidelines</h3>
                            </div>
                            <ul className="space-y-1.5 text-sm text-text-secondary ml-7">
                                <li>• Submissions <strong>may or may not be approved</strong> at our discretion</li>
                                <li>• Use <strong>direct website URLs</strong> only (no shortened or tracking links)</li>
                                <li>• Your tool must be <strong>publicly accessible</strong> (no waitlist-only tools)</li>
                                <li>• Provide <strong>accurate information</strong> – we verify all submissions</li>
                                <li>• Free submissions may take <strong>up to a week</strong> for review</li>
                                <li>• For fast-track review (<strong>24-48 hours</strong>), email <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a></li>
                            </ul>
                            <label className="flex items-center gap-2 cursor-pointer mt-4 ml-7">
                                <input type="checkbox" checked={agreedToGuidelines} onChange={(e) => setAgreedToGuidelines(e.target.checked)} className="w-4 h-4 rounded border-border bg-bg-tertiary text-accent-primary" />
                                <span className="text-sm text-text-primary">I have read and agree to the submission guidelines</span>
                            </label>
                        </div>

                        <div className="flex justify-center">
                            <Turnstile ref={turnstileRef} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                                onSuccess={(token) => setTurnstileToken(token)} onError={() => setTurnstileToken(null)} onExpire={() => setTurnstileToken(null)} />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-lg text-accent-red text-sm">
                                <AlertCircle size={16} />{error}
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting || !agreedToGuidelines || !turnstileToken}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</> : <><Send className="w-5 h-5" />Submit Tool</>}
                        </button>

                        <p className="text-xs text-text-tertiary text-center">
                            By submitting, you agree to our <Link href="/terms" className="text-accent-primary hover:underline">Terms</Link>.
                        </p>
                    </div>
                </form>
            )}
            <a
                href="mailto:support@aibde.tech?subject=Tool%20Submission%20Inquiry"
                className="group flex items-center gap-4 p-6 bg-bg-card border border-border rounded-xl hover:border-accent-primary/50 hover:shadow-lg transition-all no-underline mt-8 mb-8"
            >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                    <Send className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-0.5">Prefer to email directly?</h3>
                    <span className="text-accent-primary font-medium text-sm">support@aibde.tech</span>
                </div>
            </a>

            {/* FAQ Section */}
            <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-accent-primary" />
                    Submission FAQs
                </h2>

                <FAQItem question="Is it free to submit my AI tool?">
                    Yes! Basic listings are completely free during our limited-time offer. Submit your AI tool and it will be reviewed and added to our directory at no cost.
                </FAQItem>

                <FAQItem question="How long does the review process take?">
                    Free submissions may take up to a week or more. For fast-track review (24-48 hours), email us at <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a>.
                </FAQItem>

                <FAQItem question="What makes a good submission?">
                    Include a clear description, working website URL, accurate pricing information, and high-quality screenshots. The more details you provide, the faster we can review your tool.
                </FAQItem>

                <FAQItem question="Can I update my tool after submission?">
                    Yes! Email us at <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a> with your tool name and the changes you&apos;d like to make. We&apos;ll update the listing within 24-48 hours.
                </FAQItem>

                <FAQItem question="Will my submission be approved?">
                    Submissions may or may not be approved at our discretion. We verify all submissions to ensure quality and accuracy. Tools must be publicly accessible and provide genuine value.
                </FAQItem>

                <FAQItem question="How can I feature my tool on AiBDE?">
                    We offer featured placements and spotlight promotions. Contact us at <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a> with &quot;Featured Listing&quot; in the subject line.
                </FAQItem>
            </div>
        </div>
    );
}

// FAQ Item Component
function FAQItem({ question, children }: { question: string; children: React.ReactNode }) {
    return (
        <details className="group border-b border-border last:border-0">
            <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none hover:text-accent-primary transition-colors">
                <span className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">{question}</span>
                <ChevronDown className="w-5 h-5 text-text-tertiary group-hover:text-accent-primary transition-all duration-300 ease-out group-open:rotate-180" />
            </summary>
            <div className="overflow-hidden transition-all duration-300 ease-out">
                <div className="pb-4 text-sm text-text-secondary animate-fadeIn">
                    {children}
                </div>
            </div>
        </details>
    );
}

// Inner component that uses useSearchParams
function SubmitToolInner() {
    const searchParams = useSearchParams();
    const isPreview = searchParams.get('preview') === 'success';
    return <SubmitToolContent isPreview={isPreview} />;
}

// Default export wrapped in Suspense
export default function SubmitToolPage() {
    return (
        <Suspense fallback={<div className="max-w-[800px] mx-auto px-4 py-8 text-center text-text-secondary">Loading...</div>}>
            <SubmitToolInner />
        </Suspense>
    );
}
