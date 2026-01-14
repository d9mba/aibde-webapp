'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /login page - Redirects to search page
 * Login is only accessible via secret URL: /login/{secret}
 */
export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to search page - login only works with secret
        router.replace('/search?q=lo');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <div className="text-center p-8">
                <div className="animate-spin w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-text-secondary">Redirecting...</p>
            </div>
        </div>
    );
}
