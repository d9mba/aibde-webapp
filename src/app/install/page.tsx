import { Metadata } from 'next';
import InstallPageClient from './InstallPageClient';

export const metadata: Metadata = {
    title: 'Install BrowseForAI App | Add to Home Screen & Desktop',
    description: 'Install BrowseForAI on your iPhone, iPad, Android, Mac, or Windows PC for 1-tap instant access, full-screen browsing, and an app-like experience.',
    keywords: [
        'install BrowseForAI',
        'BrowseForAI app',
        'AI tools directory app',
        'install web app',
        'add BrowseForAI to home screen',
        'desktop AI app',
    ].join(', '),
    openGraph: {
        title: 'Install BrowseForAI App | Add to Home Screen & Desktop',
        description: 'Install BrowseForAI on your iPhone, iPad, Android, Mac, or Windows PC for 1-tap instant access and a full-screen app experience.',
        type: 'website',
        siteName: 'BrowseForAI',
        url: 'https://www.browseforai.com/install',
    },
    twitter: {
        card: 'summary',
        title: 'Install BrowseForAI App | Add to Home Screen & Desktop',
        description: 'Install BrowseForAI on your iPhone, iPad, Android, Mac, or Windows PC for 1-tap instant access.',
    },
    alternates: {
        canonical: 'https://www.browseforai.com/install',
    },
};

export default function InstallPage() {
    return <InstallPageClient />;
}
