'use client';

import { useState, useEffect, useRef } from 'react';

// Helper to determine input value based on state
function getInputValue(isOpen: boolean, multiple: boolean, search: string, selectedLabel: string): string {
    if (isOpen) return search;
    if (multiple) return search;
    return selectedLabel;
}

export interface ComboboxOption {
    value: string;
    label: string;
    image?: string; // Optional image URL (e.g., logo)
}

interface ComboboxProps {
    label: string;
    required?: boolean;
    options: ComboboxOption[];
    placeholder?: string;
    allowCreate?: boolean;
    onCreateNew?: (name: string) => Promise<void> | void;
}

interface SingleComboboxProps extends ComboboxProps {
    multiple?: false;
    value: string;
    onChange: (value: string) => void;
}

interface MultiComboboxProps extends ComboboxProps {
    multiple: true;
    value: string[];
    onChange: (value: string[]) => void;
}

type Props = SingleComboboxProps | MultiComboboxProps;

export default function Combobox(props: Props) {
    const { label, required, options, placeholder, allowCreate = true, multiple, onCreateNew } = props;

    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIdx, setFocusedIdx] = useState(-1);
    const [localOptions, setLocalOptions] = useState<ComboboxOption[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Combine DB options with locally created options
    const allOptions = [...options, ...localOptions];

    // Filter options
    const filteredOptions = allOptions.filter(o =>
        (o.label || '').toLowerCase().includes(search.toLowerCase()) &&
        (multiple ? !(props.value as string[]).includes(o.value) : true)
    );

    // Can add new?
    const canAddNew = allowCreate && search.trim().length > 0 &&
        !allOptions.some(o => (o.label || '').toLowerCase() === search.trim().toLowerCase());

    const totalItems = filteredOptions.length + (canAddNew ? 1 : 0);

    // Selected items for multi-select
    const selectedItems = multiple
        ? (props.value as string[]).map(v => allOptions.find(o => o.value === v) || { value: v, label: v })
        : [];

    // Selected label for single-select
    const selectedLabel = !multiple && props.value
        ? (allOptions.find(o => o.value === props.value)?.label || '')
        : '';

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setFocusedIdx(-1);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Reset focus on search change
    useEffect(() => { setFocusedIdx(-1); }, [search]);

    // Scroll focused item into view
    useEffect(() => {
        if (focusedIdx >= 0 && listRef.current?.children[focusedIdx]) {
            (listRef.current.children[focusedIdx] as HTMLElement).scrollIntoView({ block: 'nearest' });
        }
    }, [focusedIdx]);

    const selectOption = (value: string) => {
        if (multiple) {
            const current = props.value as string[];
            if (!current.includes(value)) {
                (props.onChange as (v: string[]) => void)([...current, value]);
            }
        } else {
            (props.onChange as (v: string) => void)(value);
        }
        setSearch('');
        setIsOpen(false);
        setFocusedIdx(-1);
        inputRef.current?.focus();
    };

    const createAndSelect = async () => {
        const name = search.trim();
        if (!name) return;

        // Call onCreateNew if provided (e.g., to add tag to DB)
        if (onCreateNew) {
            try {
                await onCreateNew(name);
            } catch (err) {
                console.error('Failed to create new item:', err);
            }
        }

        // Add to local options as fallback
        if (!allOptions.some(o => (o.label || '').toLowerCase() === name.toLowerCase())) {
            setLocalOptions(prev => [...prev, { value: name, label: name }]);
        }
        selectOption(name);
    };

    const removeOption = (value: string) => {
        if (multiple) {
            (props.onChange as (v: string[]) => void)(
                (props.value as string[]).filter(v => v !== value)
            );
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
            e.preventDefault();
            setIsOpen(true);
            setFocusedIdx(0);
            return;
        }

        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIdx(prev => (prev + 1) % totalItems);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIdx(prev => prev <= 0 ? totalItems - 1 : prev - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIdx >= 0 && focusedIdx < filteredOptions.length) {
                    selectOption(filteredOptions[focusedIdx].value);
                } else if (canAddNew) {
                    createAndSelect();
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setFocusedIdx(-1);
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {label} {required && <span className="text-accent-red">*</span>}
            </label>

            {/* Input */}
            <input
                ref={inputRef}
                type="text"
                value={getInputValue(isOpen, multiple ?? false, search, selectedLabel)}
                onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={multiple && selectedItems.length > 0 ? 'Add more...' : (placeholder || `Select ${label.toLowerCase()}...`)}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary hover:border-text-tertiary transition-colors"
            />

            {/* Dropdown */}
            {isOpen && (
                <div ref={listRef} className="absolute z-50 w-full mt-1 bg-bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredOptions.map((option, idx) => {
                        // Only one item should be highlighted at a time
                        const isHighlighted = idx === focusedIdx;

                        return (
                            <div
                                key={`${idx}-${option.value}`}
                                onClick={() => selectOption(option.value)}
                                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors text-text-primary flex items-center gap-2
                                    ${isHighlighted ? 'bg-bg-tertiary' : 'hover:bg-bg-secondary'}
                                `}
                            >
                                {option.image && (
                                    <img src={option.image} alt="" className="w-5 h-5 rounded object-contain flex-shrink-0" />
                                )}
                                <span className="truncate">{option.label}</span>
                            </div>
                        );
                    })}
                    {filteredOptions.length === 0 && !canAddNew && (
                        <div className="px-3 py-2 text-sm text-text-tertiary">No options found</div>
                    )}
                    {canAddNew && (
                        <div
                            onClick={createAndSelect}
                            className={`px-3 py-2.5 text-sm cursor-pointer text-accent-primary border-t border-border ${focusedIdx === filteredOptions.length ? 'bg-bg-tertiary' : 'hover:bg-bg-secondary'
                                }`}
                        >
                            + Create "{search}"
                        </div>
                    )}
                </div>
            )}

            {/* Multi-select chips - shown below input */}
            {multiple && selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedItems.map(item => (
                        <span key={item.value} className="inline-flex items-center gap-1 px-3 py-1 bg-bg-tertiary text-text-primary rounded-full text-sm">
                            {item.label}
                            <button type="button" onClick={() => removeOption(item.value)} className="text-text-tertiary hover:text-accent-red ml-0.5">×</button>
                        </span>
                    ))}
                </div>
            )}

            {multiple && (
                <p className="text-xs text-text-tertiary mt-1">Multiple can be selected. Type to search or add new.</p>
            )}
        </div>
    );
}
