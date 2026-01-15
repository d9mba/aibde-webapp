'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
    className?: string;
}

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = ''
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Find current label
    const currentOption = options.find(opt => opt.value === value);
    const displayLabel = currentOption?.label || placeholder;

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') setIsOpen(false);
        }
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center justify-between gap-2 min-w-[140px] px-5 py-2.5 
                    bg-bg-card border rounded-full text-sm text-text-primary cursor-pointer
                    transition-all duration-150 hover:border-text-tertiary
                    ${isOpen ? 'border-text-secondary' : 'border-border'}
                `}
            >
                <span className={value ? 'text-text-primary' : 'text-text-tertiary'}>
                    {displayLabel}
                </span>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-text-tertiary transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 py-1 bg-bg-card border border-border rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden animate-fadeIn">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value || null);
                                setIsOpen(false);
                            }}
                            className={`
                                w-full px-4 py-2.5 text-left text-sm transition-colors duration-150
                                ${option.value === value
                                    ? 'bg-accent-primary-bg text-accent-primary font-medium'
                                    : 'text-text-primary hover:bg-bg-tertiary'
                                }
                            `}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
