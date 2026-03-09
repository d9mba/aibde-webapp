import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contacts - Dashboard | AIBDE',
    description: 'AIBDE Contact Queries',
};

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
