'use client';

import React from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/context/PWAInstallContext';
import { cn } from '@/lib/utils';

interface InstallButtonProps {
    className?: string;
    variant?: 'pill' | 'icon' | 'sidebar';
}

export default function InstallButton({ className, variant = 'pill' }: InstallButtonProps) {
    const { isInstalled, promptInstall, canPrompt } = usePWAInstall();

    // If already running inside installed standalone app, hide or return null
    if (isInstalled) {
        return null;
    }

    const handleClick = async (e: React.MouseEvent) => {
        // If native prompt is supported & ready, trigger it directly without navigation
        if (canPrompt) {
            e.preventDefault();
            await promptInstall(false);
        }
        // Otherwise, allow normal link navigation to /install
    };

    if (variant === 'icon') {
        return (
            <Link
                href="/install"
                onClick={handleClick}
                prefetch={false}
                title="Install BrowseForAI App"
                aria-label="Install BrowseForAI App"
                className={cn(
                    "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-secondary transition-colors focus:outline-none",
                    className
                )}
            >
                <Download size={18} strokeWidth={1.75} />
            </Link>
        );
    }

    if (variant === 'sidebar') {
        return (
            <Link
                href="/install"
                onClick={handleClick}
                prefetch={false}
                title="Install App"
                className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-medium no-underline rounded-md transition-all duration-fast whitespace-nowrap focus:outline-none text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
                    className
                )}
            >
                <span className="flex items-center justify-center w-5 h-5 flex-shrink-0 text-accent-primary">
                    <Download size={16} strokeWidth={2} />
                </span>
                <span className="truncate">Install App</span>
            </Link>
        );
    }

    // Default: 'pill' header button (TAAFT style)
    return (
        <Link
            href="/install"
            onClick={handleClick}
            prefetch={false}
            title="Install BrowseForAI"
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold no-underline",
                "bg-bg-card hover:bg-bg-secondary text-text-primary border border-border hover:border-accent-primary",
                "transition-all duration-200 active:scale-95 group focus:outline-none flex-shrink-0",
                className
            )}
        >
            <span className="w-4 h-4 rounded-full bg-accent-primary/15 text-accent-primary flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <Download size={10} strokeWidth={2.5} />
            </span>
            <span className="tracking-tight">Install</span>
        </Link>
    );
}
