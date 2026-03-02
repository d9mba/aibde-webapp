'use client';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    function handlePageChange(page: number) {
        onPageChange(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function getPageNumbers(): (number | 'ellipsis')[] {
        const pages: (number | 'ellipsis')[] = [];

        if (totalPages <= 9) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);

        if (currentPage > 4) {
            pages.push('ellipsis');
        }

        const rangeStart = Math.max(2, currentPage - 2);
        const rangeEnd = Math.min(totalPages - 1, currentPage + 2);

        for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

        if (currentPage < totalPages - 3) {
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
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
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
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ${currentPage === page
                                ? 'bg-accent-primary text-white border border-accent-primary shadow-sm'
                                : 'border border-border bg-bg-card text-text-secondary hover:border-accent-primary hover:text-accent-primary'
                                }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-bg-card text-text-secondary transition-all duration-200 hover:border-accent-primary hover:text-accent-primary disabled:opacity-40 disabled:pointer-events-none"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
            </nav>
        </div>
    );
}
