import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trending - Dashboard | BrowseForAI',
    description: 'Manage BrowseForAI Trending tools',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
