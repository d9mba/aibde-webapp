'use client';

import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    required?: boolean;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, required, error, className, ...props }, ref) => (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                {label} {required && <span className="text-accent-red">*</span>}
            </label>
            <input
                ref={ref}
                {...props}
                className={`w-full px-3 py-2 bg-bg-secondary border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue text-sm ${error ? 'border-accent-red' : 'border-border'} ${className || ''}`}
            />
            {error && <p className="text-xs text-accent-red mt-1">{error}</p>}
        </div>
    )
);

Input.displayName = 'Input';

export default Input;
