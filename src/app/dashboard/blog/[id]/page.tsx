'use client';

import { use } from 'react';
import BlogEditor from '../BlogEditor';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditBlogPostPage({ params }: PageProps) {
    const { id } = use(params);
    return <BlogEditor postId={id} />;
}
