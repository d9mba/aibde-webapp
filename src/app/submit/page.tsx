'use client';

import { Mail, Construction } from 'lucide-react';
import Link from 'next/link';

export default function SubmitPage() {
    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10 flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-8 bg-bg-card border border-border rounded-xl max-w-lg">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-accent-orange/10 rounded-full text-accent-orange">
                    <Construction size={40} strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-text-primary mb-3">
                    Not Accepting Submissions
                </h1>

                {/* Description */}
                <p className="text-text-secondary mb-6 leading-relaxed">
                    We're currently not accepting new tool submissions while we improve our review process.
                    Please check back soon or contact us if you need further information.
                </p>

                {/* Contact Email */}
                <a
                    href="mailto:support@aibde.tech"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white font-medium rounded-lg transition-opacity duration-fast hover:opacity-90"
                >
                    <Mail size={18} />
                    Contact Us
                </a>

                {/* Back Link */}
                <p className="mt-6">
                    <Link href="/" className="text-sm text-text-tertiary hover:text-accent-primary transition-colors">
                        ← Back to Homepage
                    </Link>
                </p>
            </div>
        </div>
    );
}
