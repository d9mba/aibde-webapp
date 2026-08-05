import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tasks - Dashboard | BrowseForAI',
    description: 'Manage BrowseForAI Tasks',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
