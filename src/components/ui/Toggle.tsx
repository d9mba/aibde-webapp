'use client';

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export default function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className="sr-only"
                />
                <div
                    className={`w-10 h-5 rounded-full transition-colors border ${checked ? 'bg-accent-primary border-accent-primary' : 'bg-bg-tertiary border-border'
                        } ${disabled ? 'opacity-50' : ''}`}
                >
                    <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                    />
                </div>
            </div>
            <span className="text-sm text-text-secondary">{label}</span>
        </label>
    );
}
