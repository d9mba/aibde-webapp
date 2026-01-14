'use client';

import Link from 'next/link';
import { Mail, Instagram, Youtube, Facebook } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

export default function Footer() {
    const { isPinned } = useSidebar();

    return (
        <>
            <footer
                className={`bg-bg-primary mt-16 transition-[margin-left] duration-200 ${isPinned ? 'lg:ml-[220px]' : 'lg:ml-14'}`}
            >
                {/* Top Section - Tagline + Nav */}
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 pb-12">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left - Tagline + Social Icons */}
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-medium text-text-primary m-0">
                                    Browse, Explore & Discover
                                </h2>
                                <p className="text-sm text-text-secondary m-0">
                                    Top AI tools for your everyday tasks.
                                </p>
                            </div>
                            {/* Social Icons */}
                            <div className="flex items-center gap-3">
                                <a href="mailto:support@aibde.tech" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Email">
                                    <Mail size={18} />
                                </a>
                                <a href="https://instagram.com/aibde" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Instagram">
                                    <Instagram size={18} />
                                </a>
                                <a href="https://youtube.com/@aibde" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="YouTube">
                                    <Youtube size={18} />
                                </a>
                                <a href="https://x.com/aibde" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="X/Twitter">
                                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                <a href="https://facebook.com/aibde" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Facebook">
                                    <Facebook size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Spacer - pushes nav to the right */}
                        <div className="hidden md:block md:col-span-5"></div>

                        {/* Navigation Columns */}
                        <div className="col-span-12 md:col-span-3 flex gap-12 sm:gap-16 justify-end">
                            {/* Explore */}
                            <div className="flex flex-col gap-4">
                                <span className="text-sm font-medium text-text-primary">Explore</span>
                                <nav className="flex flex-col gap-2">
                                    <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">Home</Link>
                                    <Link href="/search" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">Search</Link>
                                    <Link href="/trending" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">Trending</Link>
                                    <Link href="/new" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">New Tools</Link>
                                </nav>
                            </div>

                            {/* Resources */}
                            <div className="flex flex-col gap-4">
                                <span className="text-sm font-medium text-text-primary">Resources</span>
                                <nav className="flex flex-col gap-2">
                                    <Link href="/category" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">Categories</Link>
                                    <Link href="/tasks" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">Tasks</Link>
                                    <Link href="/submit" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">Submit Tool</Link>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Giant Wordmark */}
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 text-center">
                    <Link href="/" className="inline-block no-underline focus:outline-none">
                        <span
                            className="block text-text-primary leading-[0.85] select-none font-orbitron"
                            style={{
                                fontSize: 'clamp(4rem, 15vw, 14rem)',
                                fontWeight: 700,
                                letterSpacing: '0.15em'
                            }}
                        >
                            aibde
                        </span>
                    </Link>
                </div>

                {/* Bottom Bar */}
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-48 lg:pb-6 pt-6">
                    <div className="flex items-center justify-center gap-6">
                        <span className="text-xs text-text-tertiary">© {new Date().getFullYear()} AIBDE</span>
                        <Link href="/privacy" className="text-xs text-text-tertiary hover:text-text-secondary transition-colors no-underline">Privacy</Link>
                        <Link href="/terms" className="text-xs text-text-tertiary hover:text-text-secondary transition-colors no-underline">Terms</Link>
                    </div>
                </div>
            </footer>
        </>
    );
}
