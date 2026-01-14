'use client';

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}

export default function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
    return (
        <label className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div
                onClick={() => !disabled && onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${checked ? 'bg-accent-blue' : 'bg-bg-tertiary'
                    }`}
            >
                <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </div>
            <span className="text-sm text-text-secondary">{label}</span>
        </label>
    );
}
