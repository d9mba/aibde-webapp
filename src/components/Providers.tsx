'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { AdminProvider } from '@/context/AdminContext';
import { SearchProvider } from '@/context/SearchContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { ImpressionsProvider } from '@/contexts/ImpressionsContext';
import { AdminTool } from '@/types';

interface ProvidersProps {
    children: React.ReactNode;
    headerTools?: AdminTool[];
}

/**
 * Wraps content with the application's context providers for analytics, admin state, theming, sidebar, search, and impressions.
 *
 * @param headerTools - Optional array of admin header tools to initialize the admin provider
 * @returns The composed provider tree containing `children`
 */
export default function Providers({ children, headerTools }: ProvidersProps) {
    return (
        <PostHogProvider>
            <AdminProvider initialTools={headerTools}>
                <ThemeProvider>
                    <SidebarProvider>
                        <SearchProvider>
                            <ImpressionsProvider>{children}</ImpressionsProvider>
                        </SearchProvider>
                    </SidebarProvider>
                </ThemeProvider>
            </AdminProvider>
        </PostHogProvider>
    );
}