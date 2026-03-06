import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Settings - Dashboard | AIBDE',
    description: 'AIBDE Dashboard Settings',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
