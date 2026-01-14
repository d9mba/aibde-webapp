'use client';

import { useState, ReactNode } from 'react';

interface SectionProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export default function Section({ title, children, defaultOpen = true }: SectionProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border border-border rounded-xl bg-bg-card">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 hover:bg-bg-secondary text-left rounded-t-xl"
            >
                <h3 className="font-semibold text-text-primary">{title}</h3>
                <span className={`transition-transform text-text-tertiary ${open ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>
            {open && (
                <div className="p-4 pt-0 space-y-4 overflow-visible">
                    {children}
                </div>
            )}
        </div>
    );
}
