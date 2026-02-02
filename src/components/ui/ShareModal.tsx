'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Link2, Check, Mail, Share2 } from 'lucide-react';
import posthog from 'posthog-js';

// Skip analytics in development
const isDevelopment = process.env.NODE_ENV !== 'production';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title: string;
    description?: string;
}

// Social platform icons as SVG components
const TwitterXIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

const DiscordIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
);

const LinkedInIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </svg>
);

export default function ShareModal({ isOpen, onClose, url, title, description }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Check for native share support
    useEffect(() => {
        setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Close on click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Add UTM params to share URL for tracking
    const addShareUtm = (baseUrl: string): string => {
        try {
            const urlObj = new URL(baseUrl);
            urlObj.searchParams.set('ref', 'aibde');
            urlObj.searchParams.set('utm_source', 'aibde');
            urlObj.searchParams.set('utm_medium', 'share');
            return urlObj.toString();
        } catch {
            const separator = baseUrl.includes('?') ? '&' : '?';
            return `${baseUrl}${separator}ref=aibde&utm_source=aibde&utm_medium=share`;
        }
    };

    const shareUrl = addShareUtm(url);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            // Track share in PostHog
            if (!isDevelopment && typeof window !== 'undefined' && posthog) {
                posthog.capture('share_link_copied', {
                    share_url: url,
                    share_title: title,
                    share_method: 'copy_link',
                });
            }
        } catch {
            // Silently fail
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: description || `Check out ${title}`,
                    url: shareUrl,
                });
                // Track share in PostHog
                if (!isDevelopment && typeof window !== 'undefined' && posthog) {
                    posthog.capture('share_completed', {
                        share_url: url,
                        share_title: title,
                        share_method: 'native_share',
                    });
                }
            } catch {
                // User cancelled or error - silently fail
            }
        }
    };

    const shareText = `Check out ${title}${description ? ` - ${description}` : ''}`;

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedTitle = encodeURIComponent(title);

    const shareOptions = [
        {
            name: 'X',
            icon: <TwitterXIcon />,
            color: '#000000',
            href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        },
        {
            name: 'Facebook',
            icon: <FacebookIcon />,
            color: '#1877F2',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        },
        {
            name: 'WhatsApp',
            icon: <WhatsAppIcon />,
            color: '#25D366',
            href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        },
        {
            name: 'LinkedIn',
            icon: <LinkedInIcon />,
            color: '#0A66C2',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        },
        {
            name: 'Telegram',
            icon: <TelegramIcon />,
            color: '#0088cc',
            href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        },
        {
            name: 'Instagram',
            icon: <InstagramIcon />,
            color: '#E4405F',
            href: `https://www.instagram.com/`,
        },
        {
            name: 'Discord',
            icon: <DiscordIcon />,
            color: '#5865F2',
            href: `https://discord.com/channels/@me`,
        },
        {
            name: 'Email',
            icon: <Mail className="w-5 h-5" />,
            color: '#EA4335',
            href: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
        },
    ];

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border sticky top-0 bg-bg-card z-10">
                    <h2 className="text-base sm:text-lg font-semibold text-text-primary">Share</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                    {/* Copy Link Section - Fixed for mobile */}
                    <div className="mb-4 sm:mb-5">
                        <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-2">Copy link</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-bg-secondary border border-border rounded-lg overflow-hidden">
                                <Link2 className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-text-primary truncate">{url}</span>
                            </div>
                            <button
                                onClick={handleCopyLink}
                                className={`w-full sm:w-auto px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${copied
                                    ? 'bg-accent-green text-white'
                                    : 'bg-accent-primary text-white hover:bg-accent-primary/90'
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="w-4 h-4" />
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Social Share Options */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-2 sm:mb-3">Share via</label>
                        <div className="grid grid-cols-4 gap-2 sm:gap-3">
                            {shareOptions.map((option) => (
                                <a
                                    key={option.name}
                                    href={option.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                        if (!isDevelopment && typeof window !== 'undefined' && posthog) {
                                            posthog.capture('share_social_clicked', {
                                                share_url: url,
                                                share_title: title,
                                                share_method: option.name.toLowerCase(),
                                            });
                                        }
                                    }}
                                    className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-border hover:border-text-tertiary transition-all group"
                                    title={option.name}
                                >
                                    <div
                                        className="transition-transform group-hover:scale-110"
                                        style={{ color: option.color }}
                                    >
                                        {option.icon}
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] text-text-tertiary group-hover:text-text-secondary truncate w-full text-center">
                                        {option.name}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Native Share Button for Mobile */}
                    {canNativeShare && (
                        <button
                            onClick={handleNativeShare}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg-secondary border border-border rounded-xl text-text-primary font-medium text-sm hover:bg-bg-tertiary transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            More sharing options
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
