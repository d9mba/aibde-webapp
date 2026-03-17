import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Submissions - Dashboard | AIBDE',
    description: 'Manage tool submissions',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
