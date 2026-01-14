'use client';

import { usePathname } from 'next/navigation';
import TopHeader from '@/components/layout/TopHeader';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';

interface LayoutWrapperProps {
    children: React.ReactNode;
}

/**
 * Client component that handles conditional rendering of Header/Footer
 * based on the current route. This allows the root layout to remain
 * a Server Component for better performance.
 */
export function LayoutWrapper({ children }: LayoutWrapperProps) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard');

    return (
        <>
            {/* Top Header for public pages */}
            {!isDashboard && <TopHeader />}

            {/* Sidebar for public pages */}
            {!isDashboard && <Header />}

            {isDashboard ? children : <main className="min-h-screen lg:pl-14 pb-20 lg:pb-0">{children}</main>}
            {!isDashboard && <Footer />}

            {/* Scroll to top button */}
            {!isDashboard && <ScrollToTop />}
        </>
    );
}


