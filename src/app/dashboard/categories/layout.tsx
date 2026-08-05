import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Categories - Dashboard | BrowseForAI',
    description: 'Manage BrowseForAI Categories',
};

export default function Layout({ children }: { children: ReactNode }) {
    return children;
}
