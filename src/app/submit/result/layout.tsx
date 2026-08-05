import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Submission Result | BrowseForAI',
    description: 'View your AI tool submission and payment status on BrowseForAI.',
};

export default function SubmitResultLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
