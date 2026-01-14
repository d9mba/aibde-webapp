import { ClerkProvider } from '@clerk/nextjs';

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            {children}
        </ClerkProvider>
    );
}
