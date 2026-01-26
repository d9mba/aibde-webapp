'use client';

import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, MessageSquare, HelpCircle, ChevronDown, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const REASON_OPTIONS = [
    { value: '', label: 'Select a reason...' },
    { value: 'support', label: 'Support' },
    { value: 'partnerships', label: 'Partnerships' },
    { value: 'custom_campaign', label: 'Custom Campaign' },
    { value: 'sales', label: 'Sales' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'press', label: 'Press' },
    { value: 'other', label: 'Other' },
];

interface FormData {
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    contactNumber: string;
    toolUrl: string;
    query: string;
    reason: string;
}

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

// Wrapper component to read search params with Suspense
function ContactPageContent({ isPreview }: { isPreview: boolean }) {
    const [formData, setFormData] = useState<FormData>({
        firstName: isPreview ? '{FirstName}' : '',
        lastName: isPreview ? '{LastName}' : '',
        companyName: '',
        email: isPreview ? '{Email}' : '',
        contactNumber: '',
        toolUrl: '',
        query: '',
        reason: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(isPreview);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const turnstileRef = useRef<TurnstileInstance>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        if (value) setFieldErrors(prev => ({ ...prev, [name]: false }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const errors: Record<string, boolean> = {};
        if (!formData.firstName) errors.firstName = true;
        if (!formData.lastName) errors.lastName = true;
        if (!formData.email) errors.email = true;
        if (!formData.query) errors.query = true;
        if (!formData.reason) errors.reason = true;

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError('Please complete the highlighted fields to submit your inquiry.');
            return;
        }

        // Validate Turnstile
        if (!turnstileToken) {
            setError('Please complete the security check.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, turnstileToken }),
            });

            if (!response.ok) throw new Error('Failed to submit form');
            setIsSubmitted(true);
        } catch {
            setError('Something went wrong. Please try again or email us directly.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-primary/10 text-accent-primary mb-4">
                    <MessageSquare className="w-8 h-8" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">Contact Us</h1>
                <p className="text-lg text-text-secondary max-w-lg mx-auto">
                    Have questions, feedback, or want to partner with us? We&apos;d love to hear from you!
                </p>
            </div>

            {/* Success Message */}
            {isSubmitted ? (
                <div className="max-w-[600px] mx-auto text-center mb-12 p-8 bg-bg-card border border-accent-green/30 rounded-xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-green/10 text-accent-green mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">Thank You!</h2>
                    <p className="text-text-secondary mb-1">
                        Thanks for contacting us, <span className="font-medium text-text-primary">{formData.firstName} {formData.lastName}</span>!
                    </p>
                    <p className="text-text-tertiary text-sm">
                        We&apos;ll get back to you at <span className="text-accent-primary">{formData.email}</span> within 24-48 hours.
                    </p>
                </div>
            ) : (
                /* Contact Form */
                <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-8 mb-12">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1.5">First Name <span className="text-accent-red">*</span></label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={`w-full px-4 py-2.5 bg-bg-primary border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none ${fieldErrors.firstName ? 'border-accent-red' : 'border-border'}`} placeholder="John" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1.5">Last Name <span className="text-accent-red">*</span></label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={`w-full px-4 py-2.5 bg-bg-primary border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none ${fieldErrors.lastName ? 'border-accent-red' : 'border-border'}`} placeholder="Doe" />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1.5">Company Name</label>
                                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none" placeholder="Acme Inc." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1.5">Email <span className="text-accent-red">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-4 py-2.5 bg-bg-primary border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none ${fieldErrors.email ? 'border-accent-red' : 'border-border'}`} placeholder="john@example.com" />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1.5">Contact Number</label>
                                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none" placeholder="+1 (555) 000-0000" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-1.5">Reason for Contact <span className="text-accent-red">*</span></label>
                                <SearchableSelect
                                    value={formData.reason}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, reason: value }));
                                        setError('');
                                        setFieldErrors(prev => ({ ...prev, reason: false }));
                                    }}
                                    options={REASON_OPTIONS.slice(1).map(opt => ({ value: opt.value, label: opt.label }))}
                                    placeholder="Select a reason..."
                                    showSearch={false}
                                    className={fieldErrors.reason ? '[&>button]:border-accent-red' : ''}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1.5">Tool URL you are referring to</label>
                            <input type="url" name="toolUrl" value={formData.toolUrl} onChange={handleChange} className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none" placeholder="https://aibde.com/app/..." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1.5">Your Query <span className="text-accent-red">*</span></label>
                            <textarea name="query" value={formData.query} onChange={handleChange} rows={4} className={`w-full px-4 py-2.5 bg-bg-primary border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none resize-none ${fieldErrors.query ? 'border-accent-red' : 'border-border'}`} placeholder="Tell us how we can help..." />
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-accent-red/10 border border-accent-red/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-accent-red flex-shrink-0" />
                                <span className="text-sm font-medium text-accent-red">{error}</span>
                            </div>
                        )}

                        {/* Cloudflare Turnstile */}
                        <div className="flex justify-center">
                            <Turnstile
                                ref={turnstileRef}
                                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                                onSuccess={(token) => {
                                    setTurnstileToken(token);
                                    setError('');
                                }}
                                onError={() => setError('Security check failed. Please try again.')}
                                onExpire={() => setTurnstileToken(null)}
                                options={{ theme: 'auto', size: 'normal' }}
                            />
                        </div>

                        <button type="submit" disabled={isSubmitting || !turnstileToken} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-xl font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Sending...</>) : (<><Send className="w-5 h-5" />Send Message</>)}
                        </button>
                    </form>
                </div>
            )}

            {/* Email Contact - Secondary Option */}
            <a
                href="mailto:support@aibde.tech"
                className="group flex items-center gap-4 p-6 bg-bg-card border border-border rounded-xl hover:border-accent-primary/50 hover:shadow-lg transition-all no-underline mb-12"
            >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                    <Mail className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-0.5">Prefer to email directly?</h3>
                    <span className="text-accent-primary font-medium text-sm">support@aibde.tech</span>
                </div>
            </a>

            {/* FAQ Section - Original Content */}
            <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-accent-primary" />
                    Frequently Asked Questions
                </h2>

                <FAQItem question="How do I submit a new AI tool?">
                    Use our <Link href="/submit" className="text-accent-primary hover:underline">Submit Tool</Link> page to add your AI product. Fill in the required details and our team will review your submission within 48 hours.
                </FAQItem>

                <FAQItem question="How can I feature my tool on AiBDE?">
                    We offer featured placements and spotlight promotions for AI tools. Contact us at <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a> with &quot;Featured Listing&quot; in the subject line for pricing and availability.
                </FAQItem>

                <FAQItem question="How can I advertise on AiBDE?">
                    We offer various advertising options including banner ads, sponsored listings, and newsletter sponsorships. Email us at <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a> for our media kit and rates.
                </FAQItem>

                <FAQItem question="How do I update information about my AI tool?">
                    Email us at <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a> with your tool name and the changes you&apos;d like to make. We&apos;ll update the listing within 24-48 hours.
                </FAQItem>

                <FAQItem question="Is it free to list my AI tool on AiBDE?">
                    Yes! Basic listings are completely free. You can submit your AI tool and it will be reviewed and added to our directory at no cost. Premium features like featured placements are available for a fee.
                </FAQItem>

                <FAQItem question="How long does the review process take?">
                    We typically review and approve submissions within 24-48 business hours. If we need additional information, we&apos;ll reach out via the email you provided.
                </FAQItem>

                <FAQItem question="Can I remove my tool from AiBDE?">
                    Yes, you can request removal of your tool at any time. Simply email us at <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a> with your tool name and we&apos;ll process the removal within 24 hours.
                </FAQItem>

                <FAQItem question="Do you accept guest posts or sponsored content?">
                    We currently don&apos;t accept guest posts. However, we do offer sponsored content opportunities. Contact us at <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a> to discuss options.
                </FAQItem>

                <FAQItem question="What is the typical response time for inquiries?">
                    We aim to respond to all inquiries within 24-48 business hours. For urgent matters, please mention &quot;URGENT&quot; in your subject line.
                </FAQItem>
            </div>
        </div>
    );
}

// Inner component that uses useSearchParams
function ContactPageInner() {
    const searchParams = useSearchParams();
    const isPreview = searchParams.get('preview') === 'success';
    return <ContactPageContent isPreview={isPreview} />;
}

// Default export wrapped in Suspense
export default function ContactPage() {
    return (
        <Suspense fallback={<div className="max-w-[1000px] mx-auto px-4 py-12 text-center text-text-secondary">Loading...</div>}>
            <ContactPageInner />
        </Suspense>
    );
}
