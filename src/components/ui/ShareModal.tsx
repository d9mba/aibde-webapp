'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Link2, Check, Mail, Share2 } from 'lucide-react';
import posthog from 'posthog-js';
import TwitterXIcon from '@/assets/svg/social/twitter-x.svg';
import FacebookIcon from '@/assets/svg/social/facebook.svg';
import WhatsAppIcon from '@/assets/svg/social/whatsapp.svg';
import TelegramIcon from '@/assets/svg/social/telegram.svg';
import LinkedInIcon from '@/assets/svg/social/linkedin.svg';

// Skip analytics in development
const isDevelopment = process.env.NODE_ENV !== 'production';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title: string;
    description?: string;
}

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
            urlObj.searchParams.set('ref', 'aibde.tech');
            urlObj.searchParams.set('utm_source', 'aibde.tech');
            urlObj.searchParams.set('utm_medium', 'share');
            return urlObj.toString();
        } catch {
            const separator = baseUrl.includes('?') ? '&' : '?';
            return `${baseUrl}${separator}ref=aibde.tech&utm_source=aibde.tech&utm_medium=share`;
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
            icon: <TwitterXIcon className="w-5 h-5" />,
            color: '#000000',
            href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        },
        {
            name: 'Facebook',
            icon: <FacebookIcon className="w-5 h-5" />,
            color: '#1877F2',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        },
        {
            name: 'WhatsApp',
            icon: <WhatsAppIcon className="w-5 h-5" />,
            color: '#25D366',
            href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        },
        {
            name: 'LinkedIn',
            icon: <LinkedInIcon className="w-5 h-5" />,
            color: '#0A66C2',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        },
        {
            name: 'Telegram',
            icon: <TelegramIcon className="w-5 h-5" />,
            color: '#0088cc',
            href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
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
