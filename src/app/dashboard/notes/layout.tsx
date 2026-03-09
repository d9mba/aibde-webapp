import type { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Notes - Dashboard | AIBDE',
    description: 'Manage AIBDE Admin Notes',
};

export default function Layout({ children }: { children: ReactNode }) {
    return children;
}
