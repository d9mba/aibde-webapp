'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Clock, RefreshCw, Loader2, Search,
    ChevronLeft, ChevronRight, ExternalLink,
    Mail, Eye, Globe, CreditCard, ArrowRight, CheckCircle2, XCircle
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { toFullUrl } from '@/lib/url';

interface Submission {
    id: string;
    submission_ref: string;
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

const EDITABLE_REVIEW_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'published', label: 'Published' },
];

function getStatusBoxClass(status: string, type: 'payment' | 'review'): string {
    if (type === 'payment') {
        switch (status) {
            case 'success': return 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary';
            case 'failed': return 'bg-accent-red/10 border-accent-red/20 text-accent-red';
            case 'initiated': return 'bg-accent-orange/10 border-accent-orange/20 text-accent-orange';
            default: return 'bg-bg-tertiary border-border text-text-tertiary';
        }
    } else {
        switch (status) {
            case 'pending': return 'bg-accent-orange/10 border-accent-orange/20 text-accent-orange';
            case 'approved': return 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary';
            case 'rejected': return 'bg-accent-red/10 border-accent-red/20 text-accent-red';
            case 'published': return 'bg-accent-green/10 border-accent-green/20 text-accent-green';
            default: return 'bg-bg-tertiary border-border text-text-tertiary';
        }
    }
}

function getStatusIcon(status: string) {
    if (status === 'success' || status === 'approved' || status === 'published') {
        return <CheckCircle2 className="w-3.5 h-3.5" />;
    }
    if (status === 'failed' || status === 'rejected') {
        return <XCircle className="w-3.5 h-3.5" />;
    }
    if (status === 'initiated' || status === 'pending') {
        return <RefreshCw className="w-3.5 h-3.5" />;
    }
    return <Clock className="w-3.5 h-3.5" />;
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
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const { showToast, updateToast } = useToast();
    const { confirm } = useConfirm();

    async function fetchSubmissions(): Promise<void> {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/dashboard/submissions');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to fetch');
            setSubmissions(json.data || []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load submissions';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchSubmissions(); }, []);

    const handleStatusUpdate = async (id: string, newStatus: string, currentStatus: string) => {
        if (newStatus === currentStatus) return;

        const sub = submissions.find(s => s.id === id);
        const name = sub?.tool_name || 'this submission';

        const confirmed = await confirm({
            title: 'Change Review Status?',
            message: `Change "${name}" from "${currentStatus}" to "${newStatus}"?`,
            confirmText: 'Yes, Update',
            cancelText: 'Cancel',
            danger: newStatus === 'rejected',
        });

        if (!confirmed) return;

        setUpdatingStatusId(id);
        const toastId = showToast(`Updating status to "${newStatus}"...`, 'loading');
        try {
            const res = await fetch('/api/dashboard/submissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, review_status: newStatus }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update status');

            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, review_status: newStatus } : s));
            if (previewSub?.id === id) {
                setPreviewSub(prev => prev ? { ...prev, review_status: newStatus } : null);
            }
            updateToast(toastId, `Status updated to "${newStatus}"`, 'success');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to update status';
            updateToast(toastId, msg, 'error');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const filtered = useMemo(() => submissions.filter(s => {
        const matchesSearch = !searchQuery ||
            (s.tool_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.submitter_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.submitter_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.submission_ref && s.submission_ref.toLowerCase().includes(searchQuery.toLowerCase()));
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
                            placeholder="Search by tool, name, email, ref or ID..."
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
                                        <img src={toFullUrl(sub.logo_url)} alt="" className="w-10 h-10 rounded-lg object-contain flex-shrink-0 bg-white" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-sm flex-shrink-0">
                                            {(sub.tool_name || '?')[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-medium text-text-primary truncate">{sub.tool_name || 'Untitled'}</div>
                                            <div className="text-xs font-mono text-text-secondary">Ref: {sub.submission_ref || '-'}</div>
                                        </div>
                                        <div className="text-xs text-text-tertiary mt-0.5">{sub.submitter_name}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium capitalize ${getStatusBoxClass(sub.payment_status, 'payment')}`}>
                                                {getStatusIcon(sub.payment_status)}
                                                {sub.payment_status || 'N/A'}
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium capitalize ${getStatusBoxClass(sub.review_status, 'review')}`}>
                                                {getStatusIcon(sub.review_status)}
                                                {sub.review_status || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block bg-bg-card border border-border rounded-xl">
                    <table className="w-full">
                        <thead className="bg-bg-secondary border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Tool</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Submitter</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Ref</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Plan</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Payment</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Review</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">
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
                                                    <img src={toFullUrl(sub.logo_url)} alt="" className="w-9 h-9 rounded-lg object-contain bg-white" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-sm">
                                                        {(sub.tool_name || '?')[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-text-primary">{sub.tool_name || 'Untitled'}</div>
                                                    <div className="text-xs text-text-tertiary">{formatDate(sub.created_at)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-text-primary">{sub.submitter_name || '-'}</div>
                                            <div className="text-xs text-text-tertiary">{sub.submitter_email || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-mono text-text-secondary bg-bg-secondary px-2 py-1 rounded border border-border">
                                                {sub.submission_ref || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary capitalize">
                                            {sub.plan_selected || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium capitalize ${getStatusBoxClass(sub.payment_status, 'payment')}`}>
                                                {getStatusIcon(sub.payment_status)}
                                                {sub.payment_status || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="w-[130px] relative">
                                                {updatingStatusId === sub.id && (
                                                    <div className="absolute inset-x-0 bottom-full mb-1 flex justify-center z-10">
                                                        <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
                                                    </div>
                                                )}
                                                <SearchableSelect
                                                    value={sub.review_status}
                                                    onChange={(v) => handleStatusUpdate(sub.id, v, sub.review_status)}
                                                    options={EDITABLE_REVIEW_OPTIONS}
                                                    placeholder="Status"
                                                    showSearch={false}
                                                    className={`w-full text-xs font-medium capitalize [&>button]:!py-1 [&>button]:!px-2.5 ${getStatusBoxClass(sub.review_status, 'review')} ${
                                                        updatingStatusId === sub.id ? 'opacity-50 pointer-events-none' : ''
                                                    }`}
                                                />
                                            </div>
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
                                                    href={`/dashboard/tools/new?submissionId=${encodeURIComponent(sub.id)}`}
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
                                    <img src={toFullUrl(previewSub.logo_url)} alt="" className="w-16 h-16 rounded-xl object-contain bg-white" />
                                ) : (
                                    <div className="w-16 h-16 bg-accent-primary/20 rounded-xl flex items-center justify-center text-2xl font-bold text-accent-primary">
                                        {(previewSub.tool_name || '?')[0]}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <h2 className="text-2xl font-bold text-text-primary">{previewSub.tool_name || 'Untitled'}</h2>
                                        <button onClick={() => setPreviewSub(null)} className="text-text-tertiary hover:text-text-primary text-xl leading-none">&times;</button>
                                    </div>
                                    <p className="text-sm text-text-secondary mt-0.5">{previewSub.submitter_name}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold uppercase tracking-wide ${getStatusBoxClass(previewSub.payment_status, 'payment')}`}>
                                            {getStatusIcon(previewSub.payment_status)}
                                            {previewSub.payment_status || 'N/A'}
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold uppercase tracking-wide ${getStatusBoxClass(previewSub.review_status, 'review')}`}>
                                            {getStatusIcon(previewSub.review_status)}
                                            {previewSub.review_status || 'N/A'}
                                        </div>
                                        {previewSub.plan_selected && (
                                            <span className="text-xs px-3 py-1.5 bg-accent-primary/10 text-accent-primary border border-accent-primary/20 rounded-md font-semibold tracking-wide uppercase">
                                                {previewSub.plan_selected}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Submission Ref</h3>
                                    <div className="inline-block px-2 py-1 bg-bg-secondary border border-border rounded text-sm font-mono text-text-primary">
                                        {previewSub.submission_ref || '-'}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Full Submission ID</h3>
                                    <p className="text-sm text-text-primary font-mono break-all">{previewSub.id}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Email</h3>
                                    {previewSub.submitter_email ? (
                                        <a href={`mailto:${previewSub.submitter_email}`} className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                                            <Mail size={14} /> {previewSub.submitter_email}
                                        </a>
                                    ) : (
                                        <span className="text-sm text-text-tertiary">—</span>
                                    )}
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
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Submitted Date</h3>
                                    <p className="text-sm text-text-primary">{formatDate(previewSub.created_at)}</p>
                                </div>
                            </div>

                            {/* Descriptions */}
                            {previewSub.short_description && (
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Short Description</h3>
                                    <div className="p-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary">
                                        {previewSub.short_description}
                                    </div>
                                </div>
                            )}
                            {previewSub.full_description && (
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Full Description</h3>
                                    <div className="p-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary whitespace-pre-wrap max-h-40 overflow-y-auto">
                                        {previewSub.full_description}
                                    </div>
                                </div>
                            )}

                            {/* Quick Links */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                                <Link
                                    href={`/dashboard/tools/new?submissionId=${encodeURIComponent(previewSub.id)}`}
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
                                    href={`/dashboard/payments?search=${encodeURIComponent(previewSub.id)}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
                                >
                                    <CreditCard size={14} /> View Payments
                                </Link>
                                <a
                                    href={`mailto:${previewSub.submitter_email}?subject=${encodeURIComponent(`Re: ${previewSub.tool_name} Submission`)}`}
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
