'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { NewsArticle, NewsCategory } from '@/types/news';
import { NEWS_CATEGORIES } from '@/types/news';
import { NewsCard } from './NewsCard';
import { NewsCardSkeletonList } from './NewsCardSkeleton';
import { Search } from 'lucide-react';

interface NewsFeedClientProps {
    initialArticles: NewsArticle[];
}

/**
 * Client-side news feed with capsule search, category filtering, and tag filtering.
 */
export function NewsFeedClient({ initialArticles }: NewsFeedClientProps) {
    const [activeCategory, setActiveCategory] = useState<NewsCategory>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [articles, setArticles] = useState<NewsArticle[]>(initialArticles);

    // Fetch from API on category change
    useEffect(() => {
        let isMounted = true;
        const fetchNews = async () => {
            setIsLoading(true);
            try {
                const url = activeCategory === 'all' 
                    ? '/api/news' 
                    : `/api/news?category=${activeCategory}`;
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    if (isMounted && json.data) {
                        setArticles(json.data);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch news:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // We already have initialArticles for 'all' on first load
        if (activeCategory === 'all' && articles.length > 0 && articles === initialArticles) {
            // skip fetch
        } else {
            fetchNews();
        }

        return () => { isMounted = false; };
    }, [activeCategory]);

    const filteredArticles = useMemo(() => {
        let filtered = articles;

        // Note: activeCategory is handled by the API fetch above, 
        // but we keep this here just in case API returns unfiltered data
        if (activeCategory !== 'all') {
            filtered = filtered.filter(a => a.category === activeCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.summary.toLowerCase().includes(q) ||
                a.tags.some(t => t.toLowerCase().includes(q))
            );
        }

        return filtered;
    }, [articles, activeCategory, searchQuery]);

    const handleCategoryChange = useCallback((category: NewsCategory) => {
        setActiveCategory(category);
    }, []);

    return (
        <>
            {/* Search Bar — Capsule style matching top header */}
            <div className="news-search-wrapper">
                <div className={`news-search ${isFocused ? 'news-search--focused' : ''}`}>
                    <form onSubmit={e => e.preventDefault()} className="news-search-form">
                        <div className="news-search-inner">
                            <Search size={18} strokeWidth={1.5} className={`news-search-icon ${isFocused ? 'news-search-icon--active' : ''}`} />
                            <input
                                id="news-search-input"
                                type="text"
                                placeholder="Search AI news..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                className="news-search-input"
                                autoComplete="off"
                                aria-label="Search news"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="news-search-clear"
                                    aria-label="Clear search"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Category Filter Pills */}
            <nav className="news-categories" aria-label="News categories">
                <div className="news-categories-inner">
                    {NEWS_CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            className={`news-category-pill ${activeCategory === cat.value ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(cat.value)}
                            aria-pressed={activeCategory === cat.value}
                        >
                            <span className="news-category-icon">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Feed */}
            <section className="news-feed" aria-label="News feed">
                {isLoading ? (
                    <NewsCardSkeletonList count={5} />
                ) : filteredArticles.length === 0 ? (
                    <div className="news-empty">
                        <p>No news found. Try a different filter or search.</p>
                    </div>
                ) : (
                    <div className="news-feed-list">
                        {filteredArticles.map(article => (
                            <NewsCard key={article.id} article={article} />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
