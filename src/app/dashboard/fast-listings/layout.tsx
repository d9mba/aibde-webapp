import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Fast Listings - Dashboard | AIBDE',
    description: 'Manage AIBDE Fast Listings',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
