'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { AdminProvider } from '@/context/AdminContext';
import { SearchProvider } from '@/context/SearchContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { AdminTool } from '@/types';

interface ProvidersProps {
    children: React.ReactNode;
    headerTools?: AdminTool[];
}

export default function Providers({ children, headerTools }: ProvidersProps) {
    return (
        <AdminProvider initialTools={headerTools}>
            <ThemeProvider>
                <SidebarProvider>
                    <SearchProvider>{children}</SearchProvider>
                </SidebarProvider>
            </ThemeProvider>
        </AdminProvider>
    );
}

