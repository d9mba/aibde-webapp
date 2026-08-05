import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Submissions - Dashboard | BrowseForAI',
    description: 'Manage BrowseForAI Submissions',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
