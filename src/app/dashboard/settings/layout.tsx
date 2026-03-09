import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Settings - Dashboard | AIBDE',
    description: 'AIBDE Dashboard Settings',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
