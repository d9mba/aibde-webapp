'use client';

import { useEffect } from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    scrollToTop?: boolean;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    scrollToTop = true,
}: PaginationProps) {
    // Clamp currentPage to valid range
    const safeTotalPages = Math.max(1, totalPages);
    const validatedPage = Math.min(Math.max(1, currentPage), safeTotalPages);

    // Sync parent when currentPage is out of valid range
    // IMPORTANT: This useEffect must be called before the early return to comply with Rules of Hooks
    useEffect(() => {
        if (currentPage !== validatedPage) {
            onPageChange(validatedPage);
        }
    }, [currentPage, validatedPage, onPageChange]);

    if (safeTotalPages <= 1) return null;

    function handlePageChange(page: number) {
        onPageChange(page);
        if (scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function getPageNumbers(): (number | 'ellipsis')[] {
        const pages: (number | 'ellipsis')[] = [];

        if (totalPages <= 9) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);

        if (validatedPage > 4) {
            pages.push('ellipsis');
        }

        const rangeStart = Math.max(2, validatedPage - 2);
        const rangeEnd = Math.min(totalPages - 1, validatedPage + 2);

        for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

        if (validatedPage < totalPages - 3) {
            pages.push('ellipsis');
        }

        pages.push(totalPages);

        return pages;
    }

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex flex-col items-center gap-3 py-6">
            <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
                <button
                    onClick={() => handlePageChange(validatedPage - 1)}
                    disabled={validatedPage === 1}
                    aria-label="Previous page"
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-bg-card text-text-secondary transition-all duration-200 hover:border-accent-primary hover:text-accent-primary disabled:opacity-40 disabled:pointer-events-none"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>

                {pageNumbers.map((page, idx) =>
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-text-tertiary text-xs">
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            aria-current={validatedPage === page ? 'page' : undefined}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ${validatedPage === page
                                ? 'bg-accent-primary text-white border border-accent-primary shadow-sm'
                                : 'border border-border bg-bg-card text-text-secondary hover:border-accent-primary hover:text-accent-primary'
                                }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => handlePageChange(validatedPage + 1)}
                    disabled={validatedPage === safeTotalPages}
                    aria-label="Next page"
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-bg-card text-text-secondary transition-all duration-200 hover:border-accent-primary hover:text-accent-primary disabled:opacity-40 disabled:pointer-events-none"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
            </nav>
        </div>
    );
}
