import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tags - Dashboard | AIBDE',
    description: 'Manage AIBDE Tags',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
