'use client';

import { use } from 'react';
import NewsEditor from '../NewsEditor';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default function EditNewsArticlePage({ params }: PageProps) {
    const { slug } = use(params);
    return <NewsEditor articleSlug={slug} />;
}
