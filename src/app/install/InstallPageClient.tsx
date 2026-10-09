'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Download, 
    CheckCircle2, 
    Zap, 
    Maximize2, 
    HardDrive, 
    Share2, 
    PlusSquare, 
    MoreVertical, 
    HelpCircle,
    ChevronDown,
    ArrowRight,
    Star,
    Sparkles
} from 'lucide-react';
import { usePWAInstall } from '@/context/PWAInstallContext';
import { 
    ChromeLogo, 
    AppleLogo, 
    AndroidLogo, 
    WindowsLogo, 
    SafariLogo 
} from '@/components/icons/BrandLogos';
import { cn } from '@/lib/utils';

type TabType = 'desktop' | 'ios' | 'android' | 'mac';

export default function InstallPageClient() {
    const { isInstalled, canPrompt, platform, browser, promptInstall } = usePWAInstall();
    const [activeTab, setActiveTab] = useState<TabType>('desktop');
    const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'accepted' | 'dismissed'>('idle');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // Auto-detect user platform to pick default tab
    useEffect(() => {
        if (platform === 'ios') {
            setActiveTab('ios');
        } else if (platform === 'android') {
            setActiveTab('android');
        } else if (platform === 'mac' && browser === 'safari') {
            setActiveTab('mac');
        } else {
            setActiveTab('desktop');
        }
    }, [platform, browser]);

    const handleInstallClick = async () => {
        if (canPrompt) {
            setInstallStatus('installing');
            const outcome = await promptInstall(false);
            if (outcome === 'accepted') {
                setInstallStatus('accepted');
            } else if (outcome === 'dismissed') {
                setInstallStatus('dismissed');
            } else {
                setInstallStatus('idle');
            }
        } else {
            // Smooth scroll to the instructions tab
            const el = document.getElementById('instructions-section');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            q: 'Is installing the BrowseForAI app free?',
            a: 'Yes, 100% free! BrowseForAI has zero subscription or installation fees.',
        },
        {
            q: 'Does it take up storage on my phone or computer?',
            a: 'Virtually none! While traditional store apps take 200MB to 500MB, BrowseForAI takes less than 2MB of local cached storage.',
        },
        {
            q: 'Do I need to manually update it?',
            a: 'No. Every time you launch BrowseForAI, it automatically synchronizes with the latest updates and newly added AI tools.',
        },
        {
            q: 'How do I uninstall it?',
            a: 'Just like any native app: on Windows or Mac, right-click the icon in your Start menu or Dock and click "Uninstall". On mobile, long-press the icon and select "Delete App" or "Remove".',
        },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
            {/* Top Badge */}
            <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary-bg border border-accent-primary text-accent-primary text-xs font-semibold">
                    <Sparkles size={13} />
                    <span>Official Web App • Instant Setup</span>
                </div>
            </div>

            {/* Hero App Card */}
            <div className="bg-bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm mb-10 text-center flex flex-col items-center">
                {/* Official App Tile */}
                <div className="mb-5 group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white border border-border p-3.5 sm:p-4 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                        <img 
                            src="/logo-trimmed.png" 
                            alt="BrowseForAI App Icon" 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                </div>

                {/* Title & Tagline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-brand font-extrabold text-text-primary tracking-normal lowercase mb-2">
                    browsefor<span className="text-accent-primary uppercase">ai</span>
                </h1>
                <p className="text-text-secondary text-sm sm:text-base max-w-lg mx-auto font-normal mb-5">
                    Your pocket handbook to explore 10,000+ AI tools. Install directly to your home screen or desktop for fast, distraction-free access.
                </p>

                {/* Rating & Meta row */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-tertiary mb-7 pb-6 border-b border-border w-full max-w-md">
                    <div className="flex items-center gap-1 text-accent-yellow font-semibold">
                        <Star size={14} fill="currentColor" />
                        <span>4.9</span>
                        <span className="text-text-tertiary font-normal">(10k+ Tools)</span>
                    </div>
                    <span className="text-border">•</span>
                    <span>Free Web App</span>
                    <span className="text-border">•</span>
                    <span>&lt; 2 MB Storage</span>
                </div>

                {/* Action CTA */}
                <div className="w-full max-w-sm flex flex-col items-center gap-3">
                    {isInstalled ? (
                        <div className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-accent-primary-bg border border-accent-primary text-accent-primary font-semibold text-sm">
                            <CheckCircle2 size={18} />
                            <span>BrowseForAI is installed on this device!</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            disabled={installStatus === 'installing'}
                            className={cn(
                                "w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-200",
                                "bg-accent-primary hover:bg-accent-green text-white shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer",
                                installStatus === 'installing' && "opacity-80 cursor-wait"
                            )}
                        >
                            <Download size={18} strokeWidth={2.5} />
                            <span>
                                {canPrompt ? 'Install BrowseForAI Now' : 'Get Install Instructions'}
                            </span>
                        </button>
                    )}

                    <Link
                        href="/"
                        className="text-xs text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1 font-medium"
                    >
                        <span>Continue in browser instead</span>
                        <ArrowRight size={12} />
                    </Link>

                    {installStatus === 'accepted' && (
                        <p className="text-xs text-accent-primary font-medium mt-1 animate-fadeIn">
                            🎉 Installation started! Check your home screen or desktop.
                        </p>
                    )}
                </div>
            </div>

            {/* Detected Platform Tip Banner */}
            <div className="mb-10 p-3.5 sm:p-4 rounded-2xl bg-bg-secondary border border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                    {platform === 'ios' && <AppleLogo size={20} className="text-text-primary" />}
                    {platform === 'android' && <AndroidLogo size={20} />}
                    {platform === 'mac' && <SafariLogo size={20} />}
                    {(platform === 'windows' || platform === 'linux' || platform === 'other') && <ChromeLogo size={20} />}
                    <div className="text-xs sm:text-sm text-text-secondary">
                        Detected device: <strong className="text-text-primary capitalize">{platform === 'other' ? 'Desktop Computer' : platform}</strong>
                        {browser !== 'other' && <span> (<span className="capitalize">{browser}</span>)</span>}
                    </div>
                </div>
                <span className="text-[11px] font-semibold text-accent-primary bg-accent-primary-bg px-2.5 py-1 rounded-full">
                    Auto-Configured
                </span>
            </div>

            {/* Instruction Tabs Section */}
            <div id="instructions-section" className="scroll-mt-24 mb-16">
                <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-1">
                        Installation Guide by Device
                    </h2>
                    <p className="text-xs sm:text-sm text-text-secondary">
                        Follow the quick steps below for your specific device.
                    </p>
                </div>

                {/* Tab Selector with Authentic Brand Logos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('desktop')}
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all border",
                            activeTab === 'desktop'
                                ? "bg-bg-card text-text-primary shadow-sm border-accent-primary"
                                : "bg-bg-secondary text-text-secondary hover:text-text-primary border-border hover:bg-bg-tertiary/50"
                        )}
                    >
                        <ChromeLogo size={18} />
                        <span>Computer</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('ios')}
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all border",
                            activeTab === 'ios'
                                ? "bg-bg-card text-text-primary shadow-sm border-accent-primary"
                                : "bg-bg-secondary text-text-secondary hover:text-text-primary border-border hover:bg-bg-tertiary/50"
                        )}
                    >
                        <AppleLogo size={17} className="text-text-primary" />
                        <span>iPhone & iPad</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('android')}
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all border",
                            activeTab === 'android'
                                ? "bg-bg-card text-text-primary shadow-sm border-accent-primary"
                                : "bg-bg-secondary text-text-secondary hover:text-text-primary border-border hover:bg-bg-tertiary/50"
                        )}
                    >
                        <AndroidLogo size={18} />
                        <span>Android</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('mac')}
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all border",
                            activeTab === 'mac'
                                ? "bg-bg-card text-text-primary shadow-sm border-accent-primary"
                                : "bg-bg-secondary text-text-secondary hover:text-text-primary border-border hover:bg-bg-tertiary/50"
                        )}
                    >
                        <SafariLogo size={18} />
                        <span>Mac Safari</span>
                    </button>
                </div>

                {/* Tab Content Cards */}
                <div className="bg-bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
                    {/* Desktop Tab */}
                    {activeTab === 'desktop' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary pb-3 border-b border-border">
                                <ChromeLogo size={20} />
                                <span>Desktop / Laptop (Chrome, Edge, Brave, Opera)</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                1
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Click Install Button</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            Click the <strong className="text-text-primary">Install</strong> button at the top of this page, or locate the install icon in your browser address bar.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-bg-card border border-border text-[11px] font-mono text-text-tertiary flex items-center justify-between">
                                            <span>browseforai.com</span>
                                            <span className="text-accent-primary font-bold">⊕ Install</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                2
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Confirm Installation</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            When the browser pop-up prompt appears, click <strong className="text-text-primary">&quot;Install&quot;</strong> to confirm.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-bg-card border border-border text-[11px] text-center font-semibold text-accent-primary">
                                            Install app? → [ Install ]
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                3
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Launch from Desktop</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            BrowseForAI now opens in its own window and is pinned to your Taskbar, Start Menu, or Desktop!
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-accent-primary-bg border border-accent-primary text-[11px] text-center font-medium text-accent-primary">
                                            ✓ Ready for 1-click launch
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* iOS Tab */}
                    {activeTab === 'ios' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary pb-3 border-b border-border">
                                <AppleLogo size={20} className="text-text-primary" />
                                <span>Apple iOS (iPhone & iPad on Safari)</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                1
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Tap Share Button</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            Open <strong className="text-text-primary">browseforai.com</strong> in Safari. Tap the <strong className="text-text-primary">Share</strong> button at the bottom of the screen (square with up arrow).
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-bg-card border border-border text-[11px] text-center font-semibold text-text-primary">
                                            Safari Toolbar → [ ⎋ Share ]
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                2
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Add to Home Screen</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            Scroll down through the share sheet options and tap <strong className="text-text-primary">&quot;Add to Home Screen&quot;</strong>.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-bg-card border border-border text-[11px] text-center font-semibold text-text-primary">
                                            Share Sheet → ⊞ Add to Home Screen
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                3
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Tap &quot;Add&quot;</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            Tap <strong className="text-text-primary">&quot;Add&quot;</strong> in the top-right corner. The BrowseForAI app icon will be placed directly onto your iPhone home screen!
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-accent-primary-bg border border-accent-primary text-[11px] text-center font-medium text-accent-primary">
                                            ✓ Placed on iPhone Home Screen
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Android Tab */}
                    {activeTab === 'android' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary pb-3 border-b border-border">
                                <AndroidLogo size={20} />
                                <span>Android (Google Chrome / Samsung Internet)</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                1
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Tap Install Button</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            Tap the <strong className="text-text-primary">Install</strong> button at the top of this page to launch the native installation dialog.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-bg-card border border-border text-[11px] text-center font-semibold text-accent-primary">
                                            Install Button → [ Install ]
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                2
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Or Chrome Menu</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            Alternatively, tap the three dots <strong className="text-text-primary">(⋮)</strong> in Chrome and select <strong className="text-text-primary">&quot;Install app&quot;</strong>.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-bg-card border border-border text-[11px] text-center font-semibold text-text-primary">
                                            Chrome Menu (⋮) → Install app
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                3
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Confirm & Launch</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            Confirm by tapping <strong className="text-text-primary">&quot;Install&quot;</strong>. The app icon is now in your app drawer and home screen.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-accent-primary-bg border border-accent-primary text-[11px] text-center font-medium text-accent-primary">
                                            ✓ Added to Home Screen & Apps
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mac Safari Tab */}
                    {activeTab === 'mac' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary pb-3 border-b border-border">
                                <SafariLogo size={20} />
                                <span>macOS (Safari on macOS Sonoma or later)</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                1
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Open File Menu</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            In Safari on your Mac, click the <strong className="text-text-primary">&quot;File&quot;</strong> menu in the top menu bar.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-bg-card border border-border text-[11px] text-center font-semibold text-text-primary">
                                            Safari Menu Bar → File
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                2
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Add to Dock</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            Select <strong className="text-text-primary">&quot;Add to Dock...&quot;</strong> from the dropdown menu list.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-bg-card border border-border text-[11px] text-center font-semibold text-text-primary">
                                            File Menu → Add to Dock...
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-bg-secondary border border-border flex flex-col justify-between transition-all duration-200 hover:border-accent-primary">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <span className="w-7 h-7 rounded-lg bg-accent-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                3
                                            </span>
                                            <h3 className="font-semibold text-sm sm:text-base text-text-primary">Confirm & Launch</h3>
                                        </div>
                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            Click <strong className="text-text-primary">&quot;Add&quot;</strong>. BrowseForAI will now live directly in your Mac Dock and Launchpad!
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border">
                                        <div className="p-2 rounded-xl bg-accent-primary-bg border border-accent-primary text-[11px] text-center font-medium text-accent-primary">
                                            ✓ Ready in Mac Dock & Launchpad
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Why Install Section */}
            <div className="mb-16">
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                        Why Install BrowseForAI?
                    </h2>
                    <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
                        Enjoy all the power of the directory with zero browser friction.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-bg-card border border-border hover:border-accent-primary transition-all duration-200 flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-accent-primary-bg text-accent-primary flex items-center justify-center mb-1">
                            <Zap size={20} />
                        </div>
                        <h3 className="text-base font-semibold text-text-primary">
                            1-Tap Instant Access
                        </h3>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                            No typing URLs or digging through tabs. Launch BrowseForAI directly from your home screen, desktop, or dock.
                        </p>
                    </div>

                    <div className="p-6 rounded-3xl bg-bg-card border border-border hover:border-accent-primary transition-all duration-200 flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-accent-primary-bg text-accent-primary flex items-center justify-center mb-1">
                            <Maximize2 size={20} />
                        </div>
                        <h3 className="text-base font-semibold text-text-primary">
                            Distraction-Free Full Screen
                        </h3>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                            Enjoy an uncluttered app experience with no URL address bars, tabs, or browser toolbars in your way.
                        </p>
                    </div>

                    <div className="p-6 rounded-3xl bg-bg-card border border-border hover:border-accent-primary transition-all duration-200 flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-accent-primary-bg text-accent-primary flex items-center justify-center mb-1">
                            <Sparkles size={20} />
                        </div>
                        <h3 className="text-base font-semibold text-text-primary">
                            Ultra-Fast Navigation
                        </h3>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                            Preloaded assets and optimized client caching provide snappy, app-grade browsing speeds across 10,000+ AI tools.
                        </p>
                    </div>

                    <div className="p-6 rounded-3xl bg-bg-card border border-border hover:border-accent-primary transition-all duration-200 flex flex-col gap-2">
                        <div className="w-10 h-10 rounded-xl bg-accent-primary-bg text-accent-primary flex items-center justify-center mb-1">
                            <HardDrive size={20} />
                        </div>
                        <h3 className="text-base font-semibold text-text-primary">
                            Virtually Zero Storage
                        </h3>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                            Takes less than 2MB and updates automatically in the background without needing app store downloads.
                        </p>
                    </div>
                </div>
            </div>

            {/* FAQ Accordion */}
            <div className="mb-14">
                <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center justify-center gap-2">
                        <HelpCircle size={20} className="text-accent-primary" />
                        <span>Frequently Asked Questions</span>
                    </h2>
                </div>

                <div className="space-y-3 max-w-2xl mx-auto">
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div
                                key={idx}
                                className="bg-bg-card border border-border rounded-2xl overflow-hidden transition-all"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-text-primary hover:bg-bg-secondary/50 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown
                                        size={16}
                                        className={cn(
                                            "text-text-tertiary transition-transform duration-200 flex-shrink-0",
                                            isOpen && "rotate-180 text-text-primary"
                                        )}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-4 text-xs sm:text-sm text-text-secondary border-t border-border pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom CTA Card */}
            <div className="text-center p-8 sm:p-10 rounded-3xl bg-bg-card border border-border shadow-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
                    Ready to Explore BrowseForAI?
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary mb-6 max-w-md mx-auto">
                    Join thousands discovering new AI tools daily.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                        onClick={handleInstallClick}
                        className="px-6 py-2.5 rounded-full font-semibold text-sm bg-accent-primary hover:bg-accent-green text-white transition-all shadow-sm cursor-pointer"
                    >
                        Install BrowseForAI
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-2.5 rounded-full font-semibold text-sm bg-bg-secondary hover:bg-bg-tertiary text-text-primary border border-border transition-all flex items-center gap-1.5"
                    >
                        <span>Explore Directory</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
