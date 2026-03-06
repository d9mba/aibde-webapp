import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trending - Dashboard | AIBDE',
    description: 'Manage AIBDE Trending tools',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
