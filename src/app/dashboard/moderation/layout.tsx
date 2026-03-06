import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Moderation - Dashboard | AIBDE',
    description: 'AIBDE Moderation Queue',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
