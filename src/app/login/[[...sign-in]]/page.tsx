import { SignIn } from '@clerk/nextjs';

/**
 * /login page - Clerk SignIn Component
 * Uses Clerk's hosted pages:
 * - Dev: https://choice-cougar-67.clerk.accounts.dev/
 * - Prod: https://accounts.aibde.tech/
 */
export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <SignIn
                appearance={{
                    elements: {
                        rootBox: 'mx-auto',
                        card: 'bg-bg-card border border-border shadow-lg',
                    }
                }}
                afterSignInUrl="/dashboard"
                signUpUrl="/sign-up"
            />
        </div>
    );
}
