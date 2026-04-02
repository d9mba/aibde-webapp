import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Spotlight - Dashboard | AIBDE',
    description: 'Manage AIBDE Spotlight tools',
};

export default function Layout({ children }: { children: ReactNode }) {
    return children;
}
