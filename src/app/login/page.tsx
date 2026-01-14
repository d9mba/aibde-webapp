'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /login page - Shows error message
 * Real login is at /login/[secret]
 */
export default function LoginPage() {
    const router = useRouter();

    // Redirect after showing error briefly
    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/');
        }, 3000);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <div className="text-center p-8 max-w-md">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                    Page Not Found
                </h1>
                <p className="text-text-secondary">
                    This page does not exist. Redirecting to home...
                </p>
            </div>
        </div>
    );
}
