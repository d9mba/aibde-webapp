import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tools - Dashboard | AIBDE',
    description: 'Manage AIBDE Tools',
};

export default function Layout({ children }: { children: ReactNode }) {
    return children;
}
