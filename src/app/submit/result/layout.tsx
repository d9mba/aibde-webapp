import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Submission Result | AiBDE',
    description: 'View your AI tool submission and payment status on AiBDE.',
};

export default function SubmitResultLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
