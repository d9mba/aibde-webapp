import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | AiBDE - AI Tools Directory',
    description: 'Read the AiBDE Privacy Policy. Learn how we collect, use, and protect your personal information when using our AI tools directory.',
    keywords: 'AiBDE privacy policy, data protection, cookie policy, personal data, AI tools directory privacy',
    openGraph: {
        title: 'Privacy Policy | AiBDE',
        description: 'Read the AiBDE Privacy Policy. Learn how we protect your data.',
        type: 'website',
        siteName: 'AiBDE',
        url: 'https://aibde.tech/privacy',
    },
    twitter: {
        card: 'summary',
        title: 'Privacy Policy | AiBDE',
        description: 'Read the AiBDE Privacy Policy.',
    },
    alternates: {
        canonical: 'https://aibde.tech/privacy',
    },
};

export default function PrivacyPage() {
    return (
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">Privacy Policy</h1>
            <p className="text-sm text-text-tertiary mb-8">Last updated: January 2026</p>

            <div className="space-y-8 text-text-secondary">
                {/* Introduction */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">1. Introduction</h2>
                    <p className="leading-relaxed">
                        This Privacy Policy explains how AIBDE (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) processes your
                        personal data when you use our website. We value the protection of your data and are
                        committed to transparency about how we collect and use information.
                    </p>
                </section>

                {/* Data We Collect */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">2. Information We Collect</h2>
                    <p className="mb-3">We may collect the following types of information:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Usage Data:</strong> Information about how you interact with our website, including pages visited and search queries.</li>
                        <li><strong>Device Information:</strong> Browser type, operating system, screen resolution, and device type.</li>
                        <li><strong>Cookies:</strong> Small data files stored on your device to enhance your browsing experience.</li>
                        <li><strong>Submission Data:</strong> Information you voluntarily provide when submitting tools or contacting us.</li>
                    </ul>
                </section>

                {/* How We Use Data */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">3. How We Use Your Information</h2>
                    <p className="mb-3">We use collected information to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Improve and optimize our website and services</li>
                        <li>Understand how users interact with our content</li>
                        <li>Provide personalized recommendations</li>
                        <li>Respond to inquiries and support requests</li>
                        <li>Prevent fraud and ensure security</li>
                    </ul>
                </section>

                {/* Cookies */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">4. Cookies</h2>
                    <p className="leading-relaxed">
                        We use cookies and similar technologies to enhance your experience. You can manage
                        cookie preferences through your browser settings. Disabling cookies may affect
                        certain features of our website.
                    </p>
                </section>

                {/* Data Security */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">5. Data Security</h2>
                    <p className="leading-relaxed">
                        We implement appropriate technical and organizational measures to protect your
                        personal information against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                </section>

                {/* Your Rights */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">6. Your Rights</h2>
                    <p className="mb-3">Depending on your location, you may have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Access the personal data we hold about you</li>
                        <li>Request correction of inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Object to or restrict processing</li>
                        <li>Data portability</li>
                    </ul>
                </section>

                {/* Changes */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">7. Changes to This Policy</h2>
                    <p className="leading-relaxed">
                        We may update this Privacy Policy from time to time. We will notify you of any
                        changes by posting the new policy on this page with an updated revision date.
                    </p>
                </section>

                {/* Contact */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">8. Contact Us</h2>
                    <p className="leading-relaxed">
                        If you have any questions about this Privacy Policy, please contact us at{' '}
                        <a href="mailto:support@aibde.tech" className="text-accent-primary hover:underline">support@aibde.tech</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
