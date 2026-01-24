'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react'; // Standard icons

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    logoUrl?: string | null;
}

interface SearchableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    showSearch?: boolean;
}

export function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    className = '',
    showSearch = true,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // 1. Performance: Memoize filtering so it doesn't run on every render
    const filteredOptions = useMemo(() => {
        if (!search) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, options]);

    // Reset highlight when search changes
    useEffect(() => {
        setHighlightIndex(0);
    }, [search]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Scroll highlighted item into view (disabled - causes jumpy behavior)
    // useEffect(() => {
    //     if (isOpen && listRef.current && highlightIndex >= 0) {
    //         const item = listRef.current.children[highlightIndex] as HTMLElement;
    //         item?.scrollIntoView({ block: 'nearest' });
    //     }
    // }, [highlightIndex, isOpen]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex(i => {
                const next = i + 1;
                return next >= filteredOptions.length ? 0 : next;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex(i => {
                const prev = i - 1;
                return prev < 0 ? filteredOptions.length - 1 : prev;
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions[highlightIndex]) {
                handleSelect(filteredOptions[highlightIndex].value);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearch('');
        }
    };

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    // Focus logic: if opening, clear search
                    if (!isOpen) setSearch('');
                }}
                className={`
                    w-full flex items-center justify-between px-3 py-2.5 
                    bg-bg-secondary border rounded-xl text-sm transition-all
                    focus:outline-none
                    ${isOpen ? 'border-text-tertiary' : 'border-border hover:border-text-tertiary'}
                `}
            >
                <span className="flex items-center gap-2 truncate">
                    {selectedOption?.logoUrl && (
                        <img src={selectedOption.logoUrl} alt="" className="w-5 h-5 rounded-md object-contain" />
                    )}
                    {selectedOption?.icon}
                    <span className={selectedOption ? 'text-text-primary font-medium' : 'text-text-tertiary'}>
                        {selectedOption?.label || placeholder}
                    </span>
                </span>
                <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute z-50 w-full mt-1 bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden"
                    tabIndex={showSearch ? undefined : -1}
                    onKeyDown={showSearch ? undefined : handleKeyDown}
                    ref={el => { if (el && !showSearch) el.focus(); }}
                    style={{ outline: 'none' }}
                >
                    {/* Search Input */}
                    {showSearch && (
                        <div className="p-2 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-3.5 h-3.5" />
                                <input
                                    autoFocus
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={searchPlaceholder}
                                    className="w-full pl-9 pr-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none placeholder:text-text-tertiary"
                                />
                            </div>
                        </div>
                    )}

                    {/* Options List */}
                    <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-8 text-center text-text-tertiary text-sm">No results found</div>
                        ) : (
                            filteredOptions.map((option, idx) => {
                                const isHighlighted = idx === highlightIndex;
                                const isSelected = value === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            w-full text-left px-3 py-2 text-sm flex items-center justify-between rounded-lg transition-colors focus:outline-none
                                            ${isHighlighted ? 'bg-bg-tertiary text-text-primary' : 'text-text-secondary hover:bg-bg-secondary'}
                                            ${isSelected ? 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            {option.logoUrl && (
                                                <img src={option.logoUrl} alt="" className="w-5 h-5 rounded-md object-contain" />
                                            )}
                                            {option.icon}
                                            <span className={isSelected ? 'font-medium' : ''}>{option.label}</span>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchableSelect;
