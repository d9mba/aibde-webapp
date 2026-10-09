'use client';

import Link from 'next/link';
import { Mail, Instagram, Youtube, Facebook } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

export default function Footer() {
    const { isPinned } = useSidebar();

    return (
        <>
            <footer
                className={`bg-bg-primary mt-20 transition-[margin-left] duration-200 ${isPinned ? 'lg:ml-[220px]' : 'lg:ml-14'}`}
            >
                {/* Main Footer Content */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-12 gap-8 lg:gap-12">
                        {/* Left - Tagline + Social */}
                        <div className="col-span-12 lg:col-span-4 text-center lg:text-left">
                            <h2 className="text-2xl lg:text-3xl font-medium text-text-primary mb-2 lowercase tracking-tight">
                                browse. discover. explore.
                            </h2>
                            <p className="text-sm font-normal text-text-secondary mb-4 lowercase">
                                your pocket handbook to explore the world of ai.
                            </p>

                            {/* Social Icons */}
                            <div className="flex items-center gap-4 justify-center lg:justify-start">
                                <a href="mailto:support@browseforai.com" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Email">
                                    <Mail size={18} />
                                </a>
                                <a href="https://instagram.com/browseforai.official" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Instagram">
                                    <Instagram size={18} />
                                </a>
                                {/* <a href="https://youtube.com/@browseforai" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="YouTube">
                                    <Youtube size={18} />
                                </a> */}
                                <a href="https://x.com/browseforai_Official" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="X/Twitter">
                                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                <a href="https://facebook.com/browseforai.official" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Facebook">
                                    <Facebook size={18} />
                                </a>
                            </div>
                        </div>

                        {/* Spacer for desktop layout */}
                        <div className="hidden lg:block lg:col-span-2"></div>

                        {/* Navigation - Explore */}
                        <div className="col-span-6 lg:col-span-3 text-center lg:text-left">
                            <h3 className="text-sm font-semibold text-text-primary mb-4">Explore</h3>
                            <nav className="flex flex-col gap-3">
                                <Link href="/" prefetch={false} className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                    Home
                                </Link>
                                <Link href="/search" prefetch={false} className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                    Search
                                </Link>
                                <Link href="/trending" prefetch={false} className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                    Trending
                                </Link>
                                <Link href="/new" prefetch={false} className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                    New Tools
                                </Link>
                            </nav>
                        </div>

                        {/* Navigation - Resources */}
                        <div className="col-span-6 lg:col-span-3 text-center lg:text-left">
                            <h3 className="text-sm font-semibold text-text-primary mb-4">Resources</h3>
                            <nav className="flex flex-col gap-3">
                                <Link href="/category" prefetch={false} className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                    Categories
                                </Link>
                                <Link href="/tasks" prefetch={false} className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                    Tasks
                                </Link>
                                <Link href="/news" prefetch={false} className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                    News
                                </Link>
                                <Link href="/blog" prefetch={false} className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                    Blog
                                </Link>
                                <Link href="/submit" prefetch={false} className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                                    Submit Tool
                                </Link>
                                <Link href="/install" prefetch={false} className="text-sm text-accent-primary hover:underline transition-colors no-underline font-medium">
                                    Install App
                                </Link>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Giant Wordmark */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 text-center">
                    <Link href="/" prefetch={false} className="inline-block no-underline focus:outline-none" aria-label="browseforai">
                        <span
                            className="block text-text-primary leading-[0.85] select-none font-brand font-extrabold tracking-normal lowercase"
                            style={{
                                fontSize: 'clamp(2.5rem, 9vw, 9rem)',
                            }}
                        >
                            browsefor<span className="text-accent-primary uppercase">ai</span>
                        </span>
                    </Link>
                </div>

                {/* Bottom Bar - Legal Links */}
                <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-48 lg:pb-8 pt-6">
                    <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                        <span className="text-xs text-text-tertiary">© {new Date().getFullYear()} browseforai</span>
                        <Link href="/about" prefetch={false} className="text-xs text-text-tertiary hover:text-text-secondary transition-colors no-underline">About</Link>
                        <Link href="/contact" prefetch={false} className="text-xs text-text-tertiary hover:text-text-secondary transition-colors no-underline">Contact</Link>
                        <Link href="/privacy" prefetch={false} className="text-xs text-text-tertiary hover:text-text-secondary transition-colors no-underline">Privacy</Link>
                        <Link href="/terms" prefetch={false} className="text-xs text-text-tertiary hover:text-text-secondary transition-colors no-underline">Terms</Link>
                    </div>
                </div>
            </footer>
        </>
    );
}
