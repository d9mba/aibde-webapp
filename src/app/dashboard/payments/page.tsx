'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Clock, RefreshCw, Loader2, Search,
    ChevronLeft, ChevronRight, ExternalLink,
    DollarSign, Mail, CreditCard, Eye, Globe,
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface Payment {
    id: string;
    submission_id: string;
    submitter_name: string;
    submitter_email: string;
    tool_name: string;
    tool_url: string;
    plan: string;
    product_id: string;
    payment_provider: string;
    payment_id: string;
    amount: number;
    currency: string;
    status: string;
    failure_reason: string;
    email_status: string;
    email_sent_at: string;
    email_provider_id: string;
    created_at: string;
    updated_at: string;
}

interface GroupedPayments {
    submission_id: string;
    tool_name: string;
    submitter_name: string;
    submitter_email: string;
    tool_url: string;
    latest_status: string;
    latest_date: string;
    total_attempts: number;
    total_amount: number;
    currency: string;
    plan: string;
    payments: Payment[];
}

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'initiated', label: 'Initiated' },
];

function getStatusClass(status: string): string {
    switch (status) {
        case 'success': return 'bg-accent-primary/10 text-accent-primary';
        case 'failed': return 'bg-accent-red/10 text-accent-red';
        case 'initiated': return 'bg-accent-orange/10 text-accent-orange';
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

function formatAmount(amount: number, currency: string): string {
    const symbols: Record<string, string> = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };
    const cur = (currency || 'USD').toUpperCase();
    return `${symbols[cur] || cur + ' '}${Number(amount || 0).toFixed(2)}`;
}

function groupBySubmission(payments: Payment[]): GroupedPayments[] {
    const map = new Map<string, GroupedPayments>();
    for (const p of payments) {
        const key = p.submission_id;
        if (!map.has(key)) {
            map.set(key, {
                submission_id: key,
                tool_name: p.tool_name || 'Unknown',
                submitter_name: p.submitter_name || 'Unknown',
                submitter_email: p.submitter_email || '',
                tool_url: p.tool_url || '',
                latest_status: p.status,
                latest_date: p.created_at,
                total_attempts: 0,
                total_amount: p.amount || 0,
                currency: p.currency || 'USD',
                plan: p.plan || '',
                payments: [],
            });
        }
        const group = map.get(key)!;
        group.payments.push(p);
        group.total_attempts++;
    }
    return Array.from(map.values());
}

const ITEMS_PER_PAGE = 20;

export default function PaymentsDashboard() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewGroup, setPreviewGroup] = useState<GroupedPayments | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    async function fetchPayments(): Promise<void> {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/dashboard/payments');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to fetch');
            setPayments(json.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load payments');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchPayments(); }, []);

    const grouped = useMemo(() => groupBySubmission(payments), [payments]);

    const filtered = useMemo(() => grouped.filter(g => {
        const matchesSearch = !searchQuery ||
            g.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.submitter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.submitter_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.submission_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || g.latest_status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [grouped, searchQuery, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

    const stats = {
        total: payments.length,
        success: payments.filter(p => p.status === 'success').length,
        failed: payments.filter(p => p.status === 'failed').length,
        initiated: payments.filter(p => p.status === 'initiated').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen p-8 bg-bg-primary flex items-center justify-center">
                <div className="text-text-secondary">Loading payments...</div>
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
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Payments</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">
                            {grouped.length} submissions · {stats.total} total payments
                            {stats.success > 0 && <> · <span className="text-accent-primary">{stats.success} success</span></>}
                            {stats.failed > 0 && <> · <span className="text-accent-red">{stats.failed} failed</span></>}
                            {stats.initiated > 0 && <> · <span className="text-accent-orange">{stats.initiated} initiated</span></>}
                        </p>
                    </div>
                    <button
                        onClick={fetchPayments}
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
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v)}
                            options={STATUS_OPTIONS}
                            placeholder="Status"
                            showSearch={false}
                            className="flex-1 sm:min-w-[130px]"
                        />
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                    {paginated.length === 0 ? (
                        <div className="bg-bg-card border border-border rounded-xl p-6 text-center text-text-tertiary">
                            No payments found
                        </div>
                    ) : (
                        paginated.map((group) => (
                            <div
                                key={group.submission_id}
                                className="bg-bg-card border border-border rounded-xl p-3 active:bg-bg-secondary transition-colors"
                                onClick={() => setPreviewGroup(group)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-sm flex-shrink-0">
                                        {group.tool_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-medium text-text-primary truncate">{group.tool_name}</div>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${getStatusClass(group.latest_status)}`}>
                                                {group.latest_status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-text-tertiary mt-0.5">{group.submitter_name}</div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs font-medium text-text-primary">
                                                {formatAmount(group.total_amount, group.currency)}
                                            </span>
                                            {group.total_attempts > 1 && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary text-text-secondary rounded">
                                                    {group.total_attempts} attempts
                                                </span>
                                            )}
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
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Plan</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Attempts</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-text-tertiary">
                                        No payments found
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((group) => (
                                    <tr
                                        key={group.submission_id}
                                        className="hover:bg-bg-secondary cursor-pointer transition-colors"
                                        onClick={() => setPreviewGroup(group)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-text-primary">{group.tool_name}</div>
                                            {group.tool_url && (
                                                <div className="text-xs text-text-tertiary truncate max-w-[200px]">
                                                    {group.tool_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-text-primary">{group.submitter_name}</div>
                                            <div className="text-xs text-text-tertiary">{group.submitter_email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-text-primary">
                                            {formatAmount(group.total_amount, group.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary capitalize">
                                            {group.plan || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusClass(group.latest_status)}`}>
                                                {group.latest_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">
                                            {group.total_attempts}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-tertiary">
                                            {formatDate(group.latest_date)}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setPreviewGroup(group)}
                                                    className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    href={`/dashboard/submissions`}
                                                    prefetch={false}
                                                    className="p-2 text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                                                    title="View Submission"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
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
            {previewGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewGroup(null)}>
                    <div className="bg-bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-border">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-text-primary">{previewGroup.tool_name}</h2>
                                    <p className="text-sm text-text-secondary mt-1">{previewGroup.submitter_name}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusClass(previewGroup.latest_status)}`}>
                                            {previewGroup.latest_status}
                                        </span>
                                        <span className="text-sm font-semibold text-text-primary">
                                            {formatAmount(previewGroup.total_amount, previewGroup.currency)}
                                        </span>
                                        {previewGroup.plan && (
                                            <span className="text-xs px-2 py-1 bg-accent-primary/10 text-accent-primary rounded-full capitalize">
                                                {previewGroup.plan}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setPreviewGroup(null)} className="text-text-tertiary hover:text-text-primary text-xl leading-none">&times;</button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Email</h3>
                                    <a href={`mailto:${previewGroup.submitter_email}`} className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                                        <Mail size={14} /> {previewGroup.submitter_email}
                                    </a>
                                </div>
                                {previewGroup.tool_url && (
                                    <div>
                                        <h3 className="text-xs font-medium text-text-tertiary mb-1">Website</h3>
                                        <a href={previewGroup.tool_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                                            <Globe size={14} /> {previewGroup.tool_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                        </a>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xs font-medium text-text-tertiary mb-1">Submission ID</h3>
                                    <p className="text-sm text-text-primary font-mono break-all">{previewGroup.submission_id}</p>
                                </div>
                            </div>

                            {/* Payment Attempts */}
                            <div>
                                <h3 className="text-xs font-medium text-text-tertiary mb-2 uppercase tracking-wide">
                                    Payment Attempts ({previewGroup.total_attempts})
                                </h3>
                                <div className="space-y-3">
                                    {previewGroup.payments.map((p, idx) => (
                                        <div key={p.id} className="p-3 bg-bg-secondary rounded-lg border border-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-text-tertiary font-medium">
                                                    #{previewGroup.total_attempts - idx}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusClass(p.status)}`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-text-tertiary">Amount: </span>
                                                    <span className="font-medium text-text-primary">{formatAmount(p.amount, p.currency)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-text-tertiary">Provider: </span>
                                                    <span className="text-text-primary">{p.payment_provider || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-text-tertiary">Date: </span>
                                                    <span className="text-text-primary">{formatDate(p.created_at)}</span>
                                                </div>
                                                {p.payment_id && (
                                                    <div>
                                                        <span className="text-text-tertiary">ID: </span>
                                                        <span className="text-text-primary font-mono text-xs break-all">{p.payment_id}</span>
                                                    </div>
                                                )}
                                                {p.email_status && p.email_status !== 'not_sent' && (
                                                    <div>
                                                        <span className="text-text-tertiary">Email: </span>
                                                        <span className={p.email_status === 'sent' ? 'text-accent-primary' : 'text-accent-red'}>
                                                            {p.email_status === 'sent' ? '✓ Sent' : '✗ Failed'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {p.failure_reason && (
                                                <div className="mt-2 p-2 bg-accent-red/10 border border-accent-red/20 rounded text-xs text-accent-red">
                                                    {p.failure_reason}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                                <a
                                    href={`/submit/result/${previewGroup.submission_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-colors"
                                >
                                    <ExternalLink size={14} /> View Result Page
                                </a>
                                <Link
                                    href={`/dashboard/submissions`}
                                    className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-bg-tertiary transition-colors"
                                >
                                    <CreditCard size={14} /> View Submission
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
