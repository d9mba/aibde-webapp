import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import Providers from '@/components/Providers';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { getWebSiteJsonLd, SEO } from '@/lib/seo';
import '@/styles/globals.css';
import '@/styles/tiptap.css';

export const metadata: Metadata = {
    metadataBase: new URL(SEO.siteUrl),
    title: {
        default: 'BrowseForAI - AI Tool Directory | Discover 10,000+ AI Tools',
        template: '%s | BrowseForAI',
    },
    description: 'Discover and compare 10,000+ AI tools for writing, design, coding, marketing, and more. Browse by category and task. Updated daily.',
    keywords: ['AI tools', 'AI directory', 'best AI tools', 'AI software', 'artificial intelligence tools', 'BrowseForAI'],
    applicationName: SEO.siteName,
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: SEO.siteName,
        url: SEO.siteUrl,
    },
    twitter: {
        card: 'summary_large_image',
        site: '@browseforai',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
    },
    alternates: {},
};

// Viewport configuration for safe area support on iOS devices
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // PERFORMANCE: Removed blocking getPublishedTools() call
    // Tools are now fetched per-page (with ISR) or lazy-loaded by AdminContext
    // This eliminates a DB query on every single page view

    // No ClerkProvider here - public routes don't need Clerk
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* JSON-LD: WebSite + Organization for SEO and sitelinks search box */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebSiteJsonLd()) }}
                />
                {/* Theme script - runs BEFORE React hydrates to prevent flash */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var mode = localStorage.getItem('themeMode') || 'system';
                                    var theme = mode;
                                    if (mode === 'system') {
                                        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                                    }
                                    document.documentElement.setAttribute('data-theme', theme);
                                } catch (e) {
                                    document.documentElement.setAttribute('data-theme', 'dark');
                                }
                            })();
                        `,
                    }}
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />

                {/* Google Tag Manager - Production only */}
                {process.env.NODE_ENV === 'production' && (
                    <Script id="gtm-script" strategy="afterInteractive">
                        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','GTM-MJ4WCNXC');`}
                    </Script>
                )}

                {/* Google Analytics - Production only */}
                {process.env.NODE_ENV === 'production' && (
                    <>
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
                    </>
                )}

                {/* Microsoft Clarity - Production only */}
                {process.env.NODE_ENV === 'production' && (
                    <Script id="ms-clarity" strategy="afterInteractive">
                        {`(function(c,l,a,r,i,t,y){
                            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                        })(window, document, "clarity", "script", "v19ejk4063");`}
                    </Script>
                )}

            </head>
            <body className="bg-bg-primary text-text-primary antialiased transition-colors duration-normal" suppressHydrationWarning>
                {/* Google Tag Manager (noscript) - Production only */}
                {process.env.NODE_ENV === 'production' && (
                    <noscript>
                        <iframe
                            src="https://www.googletagmanager.com/ns.html?id=GTM-MJ4WCNXC"
                            height="0"
                            width="0"
                            style={{ display: 'none', visibility: 'hidden' }}
                        />
                    </noscript>
                )}

                <Providers>
                    <LayoutWrapper>{children}</LayoutWrapper>
                </Providers>
            </body>
        </html>
    );
}
