'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

/**
 * Conditionally renders ClerkProvider only on routes that need authentication
 * This prevents Clerk API calls on public pages like homepage and /app/* pages
 */
export default function ConditionalClerkProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Only load Clerk on dashboard and login routes
    const needsClerk = pathname?.startsWith('/dashboard') || pathname?.startsWith('/login');

    if (needsClerk) {
        return <ClerkProvider>{children}</ClerkProvider>;
    }

    // For public routes, render without Clerk
    return <>{children}</>;
}
