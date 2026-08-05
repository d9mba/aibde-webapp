import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Fast Listings - Dashboard | BrowseForAI',
    description: 'Manage BrowseForAI Fast Listings',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
