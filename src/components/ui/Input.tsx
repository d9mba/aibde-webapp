'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, required, className = '', ...props }, ref) => {
        return (
            <div>
                {label && (
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        {label}
                        {required && <span className="text-accent-red ml-0.5">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary transition-colors ${error ? 'border-accent-red' : ''} ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-accent-red">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
