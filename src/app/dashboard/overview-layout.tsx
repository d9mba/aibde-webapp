// Note: This is a reusable layout component, NOT a Next.js route layout.
// Metadata must be exported from a file named layout.tsx or page.tsx to be auto-discovered.
import type React from 'react';
export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
