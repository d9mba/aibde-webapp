import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/features/admin/AdminLayout';
import '@/styles/globals.css';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    // Protect dashboard - redirect to home if not authenticated
    if (!userId) {
        redirect('/');
    }

    return (
        <ClerkProvider>
            <AdminLayout>{children}</AdminLayout>
        </ClerkProvider>
    );
}
