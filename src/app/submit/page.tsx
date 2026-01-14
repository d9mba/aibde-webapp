'use client';

import { useState } from 'react';

export default function SubmitPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10 flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-bg-card border border-border rounded-xl max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-accent-green-bg rounded-full text-accent-green">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-text-primary mb-2">Thank you!</h1>
                    <p className="text-text-secondary">Your AI tool has been submitted for review. We'll get back to you within 48 hours.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <section className="text-center py-8 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Submit Your AI Tool</h1>
                <p className="text-text-secondary">Get your AI tool discovered by millions of users</p>
            </section>

            <form className="max-w-xl mx-auto bg-bg-card border border-border rounded-xl p-6" onSubmit={handleSubmit}>
                <div className="mb-5">
                    <label className="block text-sm font-medium text-text-primary mb-2">Tool Name *</label>
                    <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none"
                        placeholder="My Awesome AI Tool"
                        required
                    />
                </div>

                <div className="mb-5">
                    <label className="block text-sm font-medium text-text-primary mb-2">Website URL *</label>
                    <input
                        type="url"
                        className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none"
                        placeholder="https://myaitool.com"
                        required
                    />
                </div>

                <div className="mb-5">
                    <label className="block text-sm font-medium text-text-primary mb-2">Short Description *</label>
                    <textarea
                        className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none resize-none"
                        placeholder="Describe what your AI tool does in 1-2 sentences"
                        rows={3}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Category *</label>
                        <select className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary focus:border-accent-blue focus:outline-none cursor-pointer" required>
                            <option value="">Select a category</option>
                            <option value="chatbots">Chatbots</option>
                            <option value="image-generation">Image Generation</option>
                            <option value="writing">Writing</option>
                            <option value="coding">Coding</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                            <option value="productivity">Productivity</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Pricing *</label>
                        <select className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary focus:border-accent-blue focus:outline-none cursor-pointer" required>
                            <option value="">Select pricing</option>
                            <option value="free">Free</option>
                            <option value="freemium">Freemium</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">Your Email *</label>
                    <input
                        type="email"
                        className="w-full px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <button type="submit" className="w-full py-3 bg-accent-blue text-white font-medium rounded-lg transition-opacity duration-fast hover:opacity-90">
                    Submit AI Tool
                </button>

                <p className="text-center text-sm text-text-tertiary mt-4">
                    Free submissions are reviewed within 7 days.
                    <a href="#" className="ml-1 text-accent-blue hover:underline">Get featured instantly →</a>
                </p>
            </form>
        </div>
    );
}
