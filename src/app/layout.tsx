import type { Metadata } from 'next';
import Script from 'next/script';
import Providers from '@/components/Providers';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { getPublishedTools } from '@/lib/data';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: 'aibde - AI Tool Directory',
    description: 'Discover AI tools for writing, image generation, coding, video, and more.',
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch tools on server for header search (SSR)
    const tools = await getPublishedTools();

    // No ClerkProvider here - public routes don't need Clerk
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />

                {/* Google Tag Manager */}
                <Script id="gtm-script" strategy="afterInteractive">
                    {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','GTM-MJ4WCNXC');`}
                </Script>

                {/* Google Analytics */}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-HT35EHF7PQ"
                    strategy="afterInteractive"
                />
                <Script id="ga-script" strategy="afterInteractive">
                    {`window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-HT35EHF7PQ');`}
                </Script>

                {/* Microsoft Clarity */}
                <Script id="clarity-script" strategy="afterInteractive">
                    {`(function(c,l,a,r,i,t,y){
                        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "v19ejk4063");`}
                </Script>
            </head>
            <body className="bg-bg-primary text-text-primary antialiased transition-colors duration-normal" suppressHydrationWarning>
                {/* Google Tag Manager (noscript) */}
                <noscript>
                    <iframe
                        src="https://www.googletagmanager.com/ns.html?id=GTM-MJ4WCNXC"
                        height="0"
                        width="0"
                        style={{ display: 'none', visibility: 'hidden' }}
                    />
                </noscript>

                <Providers headerTools={tools}>
                    <LayoutWrapper>{children}</LayoutWrapper>
                </Providers>
            </body>
        </html>
    );
}
