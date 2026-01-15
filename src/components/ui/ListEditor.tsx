'use client';

import { useState } from 'react';

interface ListEditorProps {
    label: string;
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
}

export default function ListEditor({ label, items, onChange, placeholder }: ListEditorProps) {
    const [input, setInput] = useState('');

    const add = () => {
        if (input.trim()) {
            onChange([...items, input.trim()]);
            setInput('');
        }
    };

    const remove = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {label}
            </label>
            <div className="flex gap-2 mb-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            add();
                        }
                    }}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary"
                />
                <button
                    type="button"
                    onClick={add}
                    className="px-3 py-2 bg-accent-primary text-white rounded-lg text-sm hover:opacity-90"
                >
                    Add
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-bg-tertiary rounded text-sm text-text-primary"
                    >
                        {item}
                        <button
                            type="button"
                            onClick={() => remove(i)}
                            className="text-text-tertiary hover:text-accent-red"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}
