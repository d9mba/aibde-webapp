import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tasks - Dashboard | AIBDE',
    description: 'Manage AIBDE Tasks',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
