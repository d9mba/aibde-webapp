export default function TermsPage() {
    return (
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">Terms and Conditions</h1>
            <p className="text-sm text-text-tertiary mb-8">Last updated: January 2026</p>

            <div className="space-y-8 text-text-secondary">
                {/* Introduction */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">Introduction and Acceptance</h2>
                    <p className="leading-relaxed">
                        Welcome to AIBDE, a platform dedicated to helping users discover AI tools and resources.
                        These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of our website and
                        services. By accessing or using AIBDE, you agree to be bound by these Terms.
                    </p>
                </section>

                {/* User Eligibility */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">1. User Eligibility</h2>
                    <p className="leading-relaxed">
                        The website is intended for individuals who are at least 13 years old. By using AIBDE,
                        you represent that you meet this age requirement. If you are under 18, you should
                        review these Terms with a parent or guardian.
                    </p>
                </section>

                {/* Use of Service */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">2. Use of Service</h2>
                    <p className="mb-3">You agree to use AIBDE only for lawful purposes. You may not:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Use the service for any illegal or unauthorized purpose</li>
                        <li>Attempt to gain unauthorized access to our systems</li>
                        <li>Interfere with the proper operation of the website</li>
                        <li>Scrape or harvest data without written permission</li>
                        <li>Submit false, misleading, or spam content</li>
                        <li>Impersonate any person or entity</li>
                    </ul>
                </section>

                {/* Tool Submissions */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">3. Tool Submissions</h2>
                    <p className="leading-relaxed">
                        If you submit an AI tool to our directory, you represent that you have the right to
                        do so and that the information provided is accurate. We reserve the right to accept,
                        reject, or remove any submission at our discretion.
                    </p>
                </section>

                {/* Intellectual Property */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">4. Intellectual Property</h2>
                    <p className="leading-relaxed">
                        All content on AIBDE, including text, graphics, logos, and software, is the property
                        of AIBDE or its content suppliers and is protected by intellectual property laws.
                        Tool listings and their associated content belong to their respective owners.
                    </p>
                </section>

                {/* Third-Party Links */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">5. Third-Party Links</h2>
                    <p className="leading-relaxed">
                        AIBDE contains links to third-party AI tools and websites. We are not responsible for
                        the content, accuracy, or practices of these external sites. Inclusion in our directory
                        does not constitute endorsement.
                    </p>
                </section>

                {/* Disclaimer */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">6. Disclaimer</h2>
                    <p className="leading-relaxed">
                        AIBDE is provided &quot;as is&quot; without warranties of any kind, express or implied.
                        We do not guarantee the accuracy, completeness, or reliability of any information
                        on the site. Use of any AI tool listed is at your own risk.
                    </p>
                </section>

                {/* Limitation of Liability */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">7. Limitation of Liability</h2>
                    <p className="leading-relaxed">
                        To the fullest extent permitted by law, AIBDE shall not be liable for any indirect,
                        incidental, special, consequential, or punitive damages arising from your use of
                        our service or any linked third-party tools.
                    </p>
                </section>

                {/* Changes to Terms */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">8. Changes to Terms</h2>
                    <p className="leading-relaxed">
                        We reserve the right to modify these Terms at any time. We will update the
                        &quot;Last updated&quot; date when changes are made. Continued use of AIBDE after changes
                        constitutes acceptance of the new Terms.
                    </p>
                </section>

                {/* Contact */}
                <section>
                    <h2 className="text-xl font-semibold text-text-primary mb-3">9. Contact Us</h2>
                    <p className="leading-relaxed">
                        If you have any questions about these Terms, please contact us at{' '}
                        <a href="mailto:support@aibde.tech" className="text-accent-blue hover:underline">support@aibde.tech</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
