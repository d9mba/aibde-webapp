import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Verified - Dashboard | BrowseForAI',
    description: 'Manage BrowseForAI Verified tools',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
