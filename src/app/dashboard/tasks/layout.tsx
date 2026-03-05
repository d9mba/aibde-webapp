import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tasks - Dashboard | AIBDE',
    description: 'Manage AIBDE Tasks',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
