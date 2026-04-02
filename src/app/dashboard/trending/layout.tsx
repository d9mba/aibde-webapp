import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trending - Dashboard | AIBDE',
    description: 'Manage AIBDE Trending tools',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
