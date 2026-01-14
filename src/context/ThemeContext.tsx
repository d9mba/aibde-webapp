'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
    theme: ResolvedTheme;
    themeMode: ThemeMode;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
    const [mounted, setMounted] = useState(false);

    // Get system preference
    const getSystemTheme = (): ResolvedTheme => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    };

    // Resolve the actual theme based on mode
    const resolveTheme = (mode: ThemeMode): ResolvedTheme => {
        if (mode === 'system') {
            return getSystemTheme();
        }
        return mode;
    };

    useEffect(() => {
        setMounted(true);
        const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
            setThemeModeState(savedMode);
            setResolvedTheme(resolveTheme(savedMode));
        } else {
            // Default to system
            setThemeModeState('system');
            setResolvedTheme(getSystemTheme());
        }
    }, []);

    // Listen for system preference changes
    useEffect(() => {
        if (!mounted) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (themeMode === 'system') {
                setResolvedTheme(getSystemTheme());
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [mounted, themeMode]);

    // Update resolved theme when mode changes
    useEffect(() => {
        if (mounted) {
            const resolved = resolveTheme(themeMode);
            setResolvedTheme(resolved);
            document.documentElement.setAttribute('data-theme', resolved);
            localStorage.setItem('themeMode', themeMode);
        }
    }, [themeMode, mounted]);

    const toggleTheme = () => {
        setThemeModeState((prev) => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'system';
            return 'light';
        });
    };

    const setThemeMode = (newMode: ThemeMode) => {
        setThemeModeState(newMode);
    };

    return (
        <ThemeContext.Provider value={{ theme: resolvedTheme, themeMode, toggleTheme, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

