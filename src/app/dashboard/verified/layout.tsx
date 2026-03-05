import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Verified - Dashboard | AIBDE',
    description: 'Manage AIBDE Verified tools',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
