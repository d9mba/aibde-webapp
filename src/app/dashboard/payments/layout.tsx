import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Payments - Dashboard | AIBDE',
    description: 'Manage payment records',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
