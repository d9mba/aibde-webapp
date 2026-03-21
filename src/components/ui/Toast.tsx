'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'loading' | 'info' | 'warning';
    title?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: Toast['type'], title?: string) => string;
    hideToast: (id: string) => void;
    updateToast: (id: string, message: string, type: Toast['type'], title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}

const defaultTitles: Record<Toast['type'], string> = {
    success: 'Success',
    error: 'Error',
    loading: 'Loading',
    info: 'Info',
    warning: 'Warning',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    // Track timeout IDs to properly clean them up
    const timeoutRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

    // Helper to clear and remove a timeout for a toast ID
    const clearToastTimeout = useCallback((id: string) => {
        if (timeoutRefs.current[id]) {
            clearTimeout(timeoutRefs.current[id]!);
            delete timeoutRefs.current[id];
        }
    }, []);

    // Helper to set a new auto-dismiss timeout
    const setToastTimeout = useCallback((id: string) => {
        // Clear any existing timeout first
        clearToastTimeout(id);

        // Set new timeout
        timeoutRefs.current[id] = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            delete timeoutRefs.current[id];
        }, 15000);
    }, [clearToastTimeout]);

    // Cleanup all pending timeouts on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            // Clear all pending timeouts
            Object.keys(timeoutRefs.current).forEach(id => {
                if (timeoutRefs.current[id]) {
                    clearTimeout(timeoutRefs.current[id]!);
                    delete timeoutRefs.current[id];
                }
            });
        };
    }, []);

    const counterRef = useRef(0);

    const showToast = useCallback((message: string, type: Toast['type'] = 'info', title?: string) => {
        const id = `${Date.now()}-${++counterRef.current}`;
        setToasts(prev => [...prev, { id, message, type, title }]);

        if (type !== 'loading') {
            setToastTimeout(id);
        }

        return id;
    }, [setToastTimeout]);

    const hideToast = useCallback((id: string) => {
        clearToastTimeout(id);
        setToasts(prev => prev.filter(t => t.id !== id));
    }, [clearToastTimeout]);

    const updateToast = useCallback((id: string, message: string, type: Toast['type'], title?: string) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, message, type, title } : t));

        // Clear existing timeout and set new one if not loading
        clearToastTimeout(id);
        if (type !== 'loading') {
            setToastTimeout(id);
        }
    }, [clearToastTimeout, setToastTimeout]);

    const getStyles = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return { border: 'border-l-green-500', icon: 'bg-green-500', iconText: '✓' };
            case 'error':
                return { border: 'border-l-red-500', icon: 'bg-red-500', iconText: '✕' };
            case 'info':
                return { border: 'border-l-emerald-500', icon: 'bg-emerald-500', iconText: 'i' };
            case 'warning':
                return { border: 'border-l-amber-500', icon: 'bg-amber-500', iconText: '!' };
            case 'loading':
                return { border: 'border-l-amber-500', icon: 'bg-amber-500', iconText: '' };
            default:
                return { border: 'border-l-gray-500', icon: 'bg-gray-500', iconText: '•' };
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, hideToast, updateToast }}>
            {children}

            {/* Toast Container - more top spacing on mobile for dashboard header */}
            <div className="fixed top-14 sm:top-4 right-2 sm:right-4 z-[500] flex flex-col gap-2 sm:gap-3">
                {toasts.map(toast => {
                    const styles = getStyles(toast.type);
                    return (
                        <div
                            key={toast.id}
                            onClick={() => hideToast(toast.id)}
                            className={`
                                cursor-pointer bg-bg-card rounded-lg shadow-lg border-l-4 ${styles.border} border border-border
                                flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 min-w-[240px] sm:min-w-[300px] max-w-[calc(100vw-1rem)] sm:max-w-[400px]
                                animate-slide-in
                            `}
                        >
                            {/* Icon */}
                            <div className={`w-8 h-8 rounded-full ${styles.icon} flex items-center justify-center flex-shrink-0`}>
                                {toast.type === 'loading' ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span className="text-white text-sm font-bold">{styles.iconText}</span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-text-primary text-sm">
                                    {toast.title || defaultTitles[toast.type]}
                                </div>
                                <div className="text-text-secondary text-xs mt-0.5 break-words line-clamp-3">
                                    {toast.message}
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => hideToast(toast.id)}
                                className="text-text-tertiary hover:text-text-primary flex-shrink-0 text-lg"
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </ToastContext.Provider>
    );
}
