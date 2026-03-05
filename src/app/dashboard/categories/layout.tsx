import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Categories - Dashboard | AIBDE',
    description: 'Manage AIBDE Categories',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
