import { Metadata } from 'next';
import { Mail, MessageSquare, HelpCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Contact Us | AiBDE',
    description: 'Get in touch with the AiBDE team. We\'d love to hear from you - whether you have questions, feedback, or partnership inquiries.',
    openGraph: {
        title: 'Contact Us | AiBDE',
        description: 'Get in touch with the AiBDE team for questions, feedback, or partnerships.',
        type: 'website',
    },
};

// FAQ Accordion Item Component with smooth animations
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

export default function ContactPage() {
    return (
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-primary/10 text-accent-primary mb-4">
                    <MessageSquare className="w-8 h-8" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">Contact Us</h1>
                <p className="text-lg text-text-secondary max-w-lg mx-auto">
                    Have questions, feedback, or want to partner with us? We&apos;d love to hear from you!
                </p>
            </div>

            {/* Email Contact */}
            <a
                href="mailto:support@aibde.tech"
                className="group flex items-center gap-4 p-6 bg-bg-card border border-border rounded-xl hover:border-accent-primary/50 hover:shadow-lg transition-all no-underline mb-12"
            >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                    <Mail className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-0.5">Email Us Directly</h3>
                    <span className="text-accent-primary font-medium text-sm">support@aibde.tech</span>
                </div>
            </a>

            {/* FAQ Section */}
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
