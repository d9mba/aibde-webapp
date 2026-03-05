import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Analytics - Dashboard | AIBDE',
    description: 'AIBDE Traffic and Analytics',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
