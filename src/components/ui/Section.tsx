'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SectionProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export default function Section({ title, children, defaultOpen = true }: SectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 flex items-center justify-between bg-bg-secondary/50 hover:bg-bg-secondary transition-colors ${isOpen ? 'rounded-t-xl' : 'rounded-xl'}`}
            >
                <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-text-tertiary" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-text-tertiary" />
                )}
            </button>
            {isOpen && (
                <div className="p-4 space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
}
