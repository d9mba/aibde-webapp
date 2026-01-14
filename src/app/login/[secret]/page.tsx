import { SignIn } from '@clerk/nextjs';
import { notFound } from 'next/navigation';

// Secret from environment variable - never expose in client bundle
const ADMIN_LOGIN_SECRET = process.env.ADMIN_LOGIN_SECRET;

interface Props {
    params: Promise<{ secret: string }>;
}

/**
 * Secret admin login page
 * Only accessible at /login/[correct-secret]
 */
export default async function SecretLoginPage({ params }: Props) {
    // Fail if secret not configured
    if (!ADMIN_LOGIN_SECRET) {
        console.error('[Auth] ADMIN_LOGIN_SECRET environment variable not set');
        notFound();
    }

    const { secret } = await params;

    // Check if the secret matches
    if (secret !== ADMIN_LOGIN_SECRET) {
        notFound();
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <div className="w-full max-w-md p-4">
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "bg-bg-card border border-border shadow-xl",
                            headerTitle: "text-text-primary",
                            headerSubtitle: "text-text-secondary",
                            socialButtonsBlockButton: "bg-bg-secondary border border-border text-text-primary hover:bg-bg-tertiary",
                            formFieldLabel: "text-text-secondary",
                            formFieldInput: "bg-bg-secondary border-border text-text-primary",
                            footerActionLink: "text-accent-blue hover:text-accent-blue/80",
                            formButtonPrimary: "bg-accent-blue hover:bg-accent-blue/90",
                        }
                    }}
                    routing="hash"
                    forceRedirectUrl="/dashboard"
                />
            </div>
        </div>
    );
}
