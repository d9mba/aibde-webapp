'use client';

import { useState, createContext, useContext, ReactNode, useCallback } from 'react';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
    return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setOptions(opts);
            setIsOpen(true);
            setResolveRef(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef?.(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef?.(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleCancel}
                    />

                    {/* Modal */}
                    <div className="relative bg-bg-secondary border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-modal-in">
                        {/* Title */}
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                            {options?.title || 'Confirm Action'}
                        </h3>

                        {/* Message */}
                        <p className="text-text-secondary text-sm mb-6">
                            {options?.message}
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
                            >
                                {options?.cancelText || 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${options?.danger
                                        ? 'bg-accent-red hover:bg-red-600'
                                        : 'bg-accent-primary hover:bg-blue-600'
                                    }`}
                            >
                                {options?.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes modal-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-modal-in {
                    animation: modal-in 0.15s ease-out;
                }
            `}</style>
        </ConfirmContext.Provider>
    );
}
