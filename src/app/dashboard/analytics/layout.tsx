import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Analytics - Dashboard | AiBDE',
    description: 'AiBDE Traffic and Analytics',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
