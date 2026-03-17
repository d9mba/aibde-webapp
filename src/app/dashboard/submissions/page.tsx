'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Clock, RefreshCw, Loader2, Search,
    ChevronLeft, ChevronRight, ExternalLink,
    Mail, Eye, Globe, CreditCard, ArrowRight,
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface Submission {
    id: string;
    tool_name: string;
    website_url: string;
    category: string;
    pricing_model: string;
    short_description: string;
    full_description: string;
    logo_url: string;
    submitter_name: string;
    submitter_email: string;
    plan_selected: string;
    payment_status: string;
    review_status: string;
    created_at: string;
}

const PAYMENT_STATUS_OPTIONS = [
    { value: 'all', label: 'All Payment' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'initiated', label: 'Initiated' },
];

const REVIEW_STATUS_OPTIONS = [
    { value: 'all', label: 'All Review' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'published', label: 'Published' },
];

function getPaymentStatusClass(status: string): string {
    switch (status) {
        case 'success': return 'bg-accent-primary/10 text-accent-primary';
        case 'failed': return 'bg-accent-red/10 text-accent-red';
        case 'initiated': return 'bg-accent-orange/10 text-accent-orange';
        default: return 'bg-bg-tertiary text-text-tertiary';
    }
}

function getReviewStatusClass(status: string): string {
    switch (status) {
        case 'pending': return 'bg-accent-orange/10 text-accent-orange';
        case 'approved': return 'bg-accent-primary/10 text-accent-primary';
        case 'rejected': return 'bg-accent-red/10 text-accent-red';
        case 'published': return 'bg-accent-green/10 text-accent-green';
        default: return 'bg-bg-tertiary text-text-tertiary';
    }
}

function formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

const ITEMS_PER_PAGE = 20;

export default function SubmissionsDashboard() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewSub, setPreviewSub] = useState<Submission | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [reviewFilter, setReviewFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    async function fetchSubmissions(): Promise<void> {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/dashboard/submissions');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to fetch');
            setSubmissions(json.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load submissions');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchSubmissions(); }, []);

    const filtered = useMemo(() => submissions.filter(s => {
        const matchesSearch = !searchQuery ||
            (s.tool_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.submitter_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.submitter_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPayment = paymentFilter === 'all' || s.payment_status === paymentFilter;
        const matchesReview = reviewFilter === 'all' || s.review_status === reviewFilter;
        return matchesSearch && matchesPayment && matchesReview;
    }), [submissions, searchQuery, paymentFilter, reviewFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, paymentFilter, reviewFilter]);

    const stats = {
        total: submissions.length,
        pending: submissions.filter(s => s.review_status === 'pending').length,
        approved: submissions.filter(s => s.review_status === 'approved').length,
        published: submissions.filter(s => s.review_status === 'published').length,
        paid: submissions.filter(s => s.payment_status === 'success').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-text-secondary">Loading submissions...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-accent-red">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Tool Submissions</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">
                            {stats.total} total
                            {stats.paid > 0 && <> · <span className="text-accent-primary">{stats.paid} paid</span></>}
                            {stats.pending > 0 && <> · <span className="text-accent-orange">{stats.pending} pending</span></>}
                            {stats.approved > 0 && <> · <span className="text-accent-primary">{stats.approved} approved</span></>}
                            {stats.published > 0 && <> · <span className="text-accent-green">{stats.published} published</span></>}
                        </p>
                    </div>
                    <button
                        onClick={fetchSubmissions}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-bg-secondary border border-border text-text-primary rounded-lg text-xs sm:text-sm font-medium hover:bg-bg-tertiary transition-colors"
                    >
                        <RefreshCw size={16} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 mb-4 p-3 sm:p-4 bg-bg-card border border-border rounded-xl">
                    <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by tool, name, email, or ID..."
                            className="w-full pl-9 pr-4 py-2 sm:py-2.5 text-sm bg-bg-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <SearchableSelect
                            value={paymentFilter}
                            onChange={(v) => setPaymentFilter(v)}
                            options={PAYMENT_STATUS_OPTIONS}
                            placeholder="Payment"
                            showSearch={false}
                            className="flex-1 sm:min-w-[130px]"
                        />
                        <SearchableSelect
                            value={reviewFilter}
                            onChange={(v) => setReviewFilter(v)}
                            options={REVIEW_STATUS_OPTIONS}
                            placeholder="Review"
                            showSearch={false}
                            className="flex-1 sm:min-w-[130px]"
                        />
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                    {paginated.length === 0 ? (
                        <div className="bg-bg-card border border-border rounded-xl p-6 text-center text-text-tertiary">
                            No submissions found
                        </div>
                    ) : (
                        paginated.map((sub) => (
                            <div
                                key={sub.id}
                                className="bg-bg-card border border-border rounded-xl p-3 active:bg-bg-secondary transition-colors"
                                onClick={() => setPreviewSub(sub)}
                            >
                                <div className="flex items-start gap-3">
                                    {sub.logo_url ? (
                                        <img src={sub.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-sm flex-shrink-0">
                                            {(sub.tool_name || '?')[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-medium text-text-primary truncate">{sub.tool_name || 'Untitled'}</div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getPaymentStatusClass(sub.payment_status)}`}>
                                                    {sub.payment_status || 'N/A'}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getReviewStatusClass(sub.review_status)}`}>
                                                    {sub.review_status || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-text-tertiary mt-0.5">{sub.submitter_name}</div>
                                        <div className="flex items-center gap-2 mt-2 text-[10px] text-text-tertiary">
                                            <span className="font-mono">{sub.id.slice(0, 8)}...</span>
                                            {sub.plan_selected && <span className="capitalize">{sub.plan_selected}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block bg-bg-card border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-bg-secondary border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Tool</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Submitter</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Submission ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Plan</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Payment</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Review</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-text-tertiary">
                                        No submissions found
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((sub) => (
                                    <tr
                                        key={sub.id}
                                        className="hover:bg-bg-secondary cursor-pointer transition-colors"
                                        onClick={() => setPreviewSub(sub)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {sub.logo_url ? (
                                                    <img src={sub.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-sm">
                                                        {(sub.tool_name || '?')[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-text-primary">{sub.tool_name || 'Untitled'}</div>
                                                    {sub.website_url && (
                                                        <div className="text-xs text-text-tertiary truncate max-w-[180px]">
                                                            {sub.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-text-primary">{sub.submitter_name || '-'}</div>
                                            <div className="text-xs text-text-tertiary">{sub.submitter_email || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-mono text-text-secondary">{sub.id.slice(0, 8)}...</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary capitalize">
                                            {sub.plan_selected || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentStatusClass(sub.payment_status)}`}>
                                                {sub.payment_status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getReviewStatusClass(sub.review_status)}`}>
                                                {sub.review_status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-tertiary">
                                            {formatDate(sub.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setPreviewSub(sub)}
                                                    className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    href="/dashboard/tools/new"
                                                    prefetch={false}
                                                    className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                    title="Create Tool from Submission"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 p-3 sm:p-4 bg-bg-card border border-border rounded-xl">
                        <div className="text-sm text-text-secondary">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <span className="px-3 py-2 text-sm font-medium text-text-primary bg-accent-primary/10 rounded-lg">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewSub && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewSub(null)}>
                    <div className="bg-bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-border">
                            <div className="flex items-start gap-4">
                                {previewSub.logo_url ? (
                                    <img src={previewSub.logo_url} alt="" className="w-16 h-16 rounded-xl object-contain" />
                                ) : (
                                    <div className="w-16 h-16 bg-accent-primary/20 rounded-xl flex items-center justify-center text-2xl font-bold text-accent-primary">
                                        {(previewSub.tool_name || '?')[0]}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-text-primary">{previewSub.tool_name || 'Untitled'}</h2>
                                    <p className="text-sm text-text-secondary mt-0.5">{previewSub.submitter_name}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentStatusClass(previewSub.payment_status)}`}>
                                            Payment: {previewSub.payment_status || 'N/A'}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getReviewStatusClass(previewSub.review_status)}`}>
                                            Review: {previewSub.review_status || 'N/A'}
                                        </span>
                                        {previewSub.plan_selected && (
                                            <span className="text-xs px-2 py-1 bg-accent-primary/10 text-accent-primary rounded-full capitalize">
                                                {previewSub.plan_selected}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setPreviewSub(null)} className="text-text-tertiary hover:text-text-primary text-xl leading-none">&times;</button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Submission ID</h3>
                                    <p className="text-sm text-text-primary font-mono break-all">{previewSub.id}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Email</h3>
                                    <a href={`mailto:${previewSub.submitter_email}`} className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                                        <Mail size={14} /> {previewSub.submitter_email}
                                    </a>
                                </div>
                                {previewSub.website_url && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-1">Website</h3>
                                        <a href={previewSub.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                                            <Globe size={14} /> {previewSub.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                        </a>
                                    </div>
                                )}
                                {previewSub.category && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-1">Category</h3>
                                        <p className="text-sm text-text-primary capitalize">{previewSub.category}</p>
                                    </div>
                                )}
                                {previewSub.pricing_model && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-1">Pricing Model</h3>
                                        <p className="text-sm text-text-primary capitalize">{previewSub.pricing_model}</p>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Submitted</h3>
                                    <p className="text-sm text-text-primary">{formatDate(previewSub.created_at)}</p>
                                </div>
                            </div>

                            {/* Descriptions */}
                            {previewSub.short_description && (
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Short Description</h3>
                                    <div className="p-3 bg-bg-secondary rounded-lg text-sm text-text-primary">
                                        {previewSub.short_description}
                                    </div>
                                </div>
                            )}
                            {previewSub.full_description && (
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Full Description</h3>
                                    <div className="p-3 bg-bg-secondary rounded-lg text-sm text-text-primary whitespace-pre-wrap max-h-40 overflow-y-auto">
                                        {previewSub.full_description}
                                    </div>
                                </div>
                            )}

                            {/* Quick Links */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                                <Link
                                    href="/dashboard/tools/new"
                                    className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-colors"
                                >
                                    <ArrowRight size={14} /> Create Tool from This
                                </Link>
                                <a
                                    href={`/submit/result/${previewSub.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
                                >
                                    <ExternalLink size={14} /> Result Page
                                </a>
                                <Link
                                    href="/dashboard/payments"
                                    className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
                                >
                                    <CreditCard size={14} /> View Payments
                                </Link>
                                <a
                                    href={`mailto:${previewSub.submitter_email}?subject=Re: ${previewSub.tool_name} Submission`}
                                    className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
                                >
                                    <Mail size={14} /> Email
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
