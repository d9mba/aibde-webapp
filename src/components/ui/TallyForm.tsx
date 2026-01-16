'use client';

import { useEffect } from 'react';

interface TallyFormProps {
    formId: string;
    className?: string;
}

declare global {
    interface Window {
        Tally?: {
            loadEmbeds: () => void;
        };
    }
}

export default function TallyForm({ formId, className = '' }: TallyFormProps) {
    useEffect(() => {
        const loadTally = () => {
            if (window.Tally) {
                window.Tally.loadEmbeds();
            } else {
                // Fallback: set src directly
                document.querySelectorAll('iframe[data-tally-src]:not([src])').forEach((el) => {
                    const iframe = el as HTMLIFrameElement;
                    iframe.src = iframe.dataset.tallySrc || '';
                });
            }
        };

        // Check if script already exists
        const existingScript = document.querySelector('script[src="https://tally.so/widgets/embed.js"]');

        if (existingScript) {
            loadTally();
            return;
        }

        // Load Tally script
        const script = document.createElement('script');
        script.src = 'https://tally.so/widgets/embed.js';
        script.async = true;
        script.onload = loadTally;
        script.onerror = loadTally;
        document.body.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, [formId]);

    return (
        <iframe
            data-tally-src={`https://tally.so/embed/${formId}?alignLeft=1&hideTitle=1&dynamicHeight=1&hideBranding=1`}
            loading="lazy"
            width="100%"
            height="500"
            frameBorder="0"
            title="Contact Form"
            className={`min-h-[500px] rounded-lg ${className}`}
        />
    );
}
