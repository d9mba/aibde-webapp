'use client';

import { useState, useEffect } from 'react';
import { ChevronsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show button when page is scrolled down 300px
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                "fixed z-[100] w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-full shadow-lg",
                "flex items-center justify-center text-emerald-500 hover:bg-emerald-500/30 hover:text-emerald-400",
                "transition-all duration-200 focus:outline-none",
                "right-4 lg:bottom-6 lg:right-6",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}
            style={{ bottom: 'max(80px, calc(60px + env(safe-area-inset-bottom, 0px)))' }}
            aria-label="Scroll to top"
        >
            <ChevronsUp size={20} strokeWidth={2} />
        </button>
    );
}
