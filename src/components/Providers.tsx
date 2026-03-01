'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { AdminProvider } from '@/context/AdminContext';
import { SearchProvider } from '@/context/SearchContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { ImpressionsProvider } from '@/context/ImpressionsContext';
import { AdminTool } from '@/types';

interface ProvidersProps {
    children: React.ReactNode;
    headerTools?: AdminTool[];
}

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
