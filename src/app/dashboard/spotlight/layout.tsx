import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Spotlight - Dashboard | BrowseForAI',
    description: 'Manage BrowseForAI Spotlight tools',
};

export default function Layout({ children }: { children: ReactNode }) {
    return children;
}
