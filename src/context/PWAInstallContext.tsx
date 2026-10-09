'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type UserPlatform = 'windows' | 'mac' | 'ios' | 'android' | 'linux' | 'other';
export type UserBrowser = 'chrome' | 'edge' | 'safari' | 'firefox' | 'brave' | 'opera' | 'other';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

interface PWAInstallContextType {
    isInstallable: boolean;
    isInstalled: boolean;
    canPrompt: boolean;
    platform: UserPlatform;
    browser: UserBrowser;
    promptInstall: (redirectFallback?: boolean) => Promise<'accepted' | 'dismissed' | 'redirected' | 'unsupported'>;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

function detectPlatform(): UserPlatform {
    if (typeof window === 'undefined') return 'other';
    const ua = window.navigator.userAgent.toLowerCase();
    
    // iOS detection (including iPadOS)
    if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        return 'ios';
    }
    if (/android/.test(ua)) return 'android';
    if (/win/.test(ua)) return 'windows';
    if (/mac/.test(ua)) return 'mac';
    if (/linux/.test(ua)) return 'linux';
    return 'other';
}

function detectBrowser(): UserBrowser {
    if (typeof window === 'undefined') return 'other';
    const ua = window.navigator.userAgent.toLowerCase();

    if (/edg\//.test(ua)) return 'edge';
    if (/opr\//.test(ua) || /opera/.test(ua)) return 'opera';
    if (typeof (window as unknown as { brave?: unknown }).brave !== 'undefined') return 'brave';
    if (/chrome|chromium|crios/.test(ua)) return 'chrome';
    if (/safari/.test(ua) && !/chrome|crios/.test(ua)) return 'safari';
    if (/firefox|fxios/.test(ua)) return 'firefox';
    return 'other';
}

function checkIsInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check display-mode standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Check iOS standalone
    const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    
    return Boolean(isStandalone || isIosStandalone);
}

export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [platform, setPlatform] = useState<UserPlatform>('other');
    const [browser, setBrowser] = useState<UserBrowser>('other');

    useEffect(() => {
        setPlatform(detectPlatform());
        setBrowser(detectBrowser());
        setIsInstalled(checkIsInstalled());

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent immediate automatic mini-infobar on mobile Chrome
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Also listen to display-mode change
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                setIsInstalled(true);
            }
        };
        mediaQuery.addEventListener('change', handleDisplayModeChange);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            mediaQuery.removeEventListener('change', handleDisplayModeChange);
        };
    }, []);

    const promptInstall = useCallback(async (redirectFallback = true): Promise<'accepted' | 'dismissed' | 'redirected' | 'unsupported'> => {
        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                setDeferredPrompt(null);
                return choice.outcome;
            } catch (err) {
                console.error('Error invoking install prompt:', err);
            }
        }

        if (redirectFallback) {
            router.push('/install');
            return 'redirected';
        }

        return 'unsupported';
    }, [deferredPrompt, router]);

    return (
        <PWAInstallContext.Provider
            value={{
                isInstallable: Boolean(deferredPrompt),
                isInstalled,
                canPrompt: Boolean(deferredPrompt),
                platform,
                browser,
                promptInstall,
            }}
        >
            {children}
        </PWAInstallContext.Provider>
    );
}

export function usePWAInstall() {
    const context = useContext(PWAInstallContext);
    if (!context) {
        throw new Error('usePWAInstall must be used within a PWAInstallProvider');
    }
    return context;
}
