import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Moderation - Dashboard | BrowseForAI',
    description: 'BrowseForAI Moderation Queue',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
