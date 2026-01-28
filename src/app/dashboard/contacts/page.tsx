'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, Building2, Link2, MessageSquare, Clock, CheckCircle, Loader2, RefreshCw, ExternalLink, Search, Filter } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface ContactSubmission {
    id: number;
    timestamp: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    phone: string;
    toolUrl: string;
    reason: string;
    query: string;
    status: string;
    repliedDate: string;
    notes: string;
}

const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'New', label: 'New' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Replied', label: 'Replied' },
    { value: 'Resolved', label: 'Resolved' },
];

const REASON_OPTIONS = [
    { value: '', label: 'All Reasons' },
    { value: 'support', label: 'Support' },
    { value: 'partnerships', label: 'Partnerships' },
    { value: 'custom_campaign', label: 'Custom Campaign' },
    { value: 'sales', label: 'Sales' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'press', label: 'Press' },
    { value: 'other', label: 'Other' },
];

function getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
        case 'new': return 'bg-accent-red/10 text-accent-red border-accent-red/30';
        case 'in progress': return 'bg-accent-orange/10 text-accent-orange border-accent-orange/30';
        case 'replied': return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
        case 'resolved': return 'bg-accent-green/10 text-accent-green border-accent-green/30';
        default: return 'bg-bg-secondary text-text-tertiary border-border';
    }
}

function formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

export default function ContactsDashboard() {
    const [contacts, setContacts] = useState<ContactSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [reasonFilter, setReasonFilter] = useState('');

    const fetchContacts = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/contacts');
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to fetch');
            setContacts(json.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    // Filter contacts
    const filteredContacts = contacts.filter(c => {
        const matchesSearch = !searchQuery ||
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.query.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || c.status === statusFilter;
        const matchesReason = !reasonFilter || c.reason === reasonFilter;
        return matchesSearch && matchesStatus && matchesReason;
    });

    // Stats
    const stats = {
        total: contacts.length,
        new: contacts.filter(c => c.status === 'New').length,
        inProgress: contacts.filter(c => c.status === 'In Progress').length,
        resolved: contacts.filter(c => c.status === 'Resolved' || c.status === 'Replied').length,
    };

    return (
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Contact Submissions</h1>
                    <p className="text-sm text-text-tertiary mt-1">Manage contact form submissions</p>
                </div>
                <button
                    onClick={fetchContacts}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-text-primary">{stats.total}</span>
                    <span className="text-text-tertiary">Total</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border" />
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-accent-red">{stats.new}</span>
                    <span className="text-text-tertiary">New</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border" />
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-accent-orange">{stats.inProgress}</span>
                    <span className="text-text-tertiary">In Progress</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border" />
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-accent-green">{stats.resolved}</span>
                    <span className="text-text-tertiary">Resolved</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or message..."
                        className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
                    />
                </div>
                <SearchableSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={STATUS_OPTIONS}
                    placeholder="Status"
                    showSearch={false}
                    className="w-full sm:w-40"
                />
                <SearchableSelect
                    value={reasonFilter}
                    onChange={setReasonFilter}
                    options={REASON_OPTIONS}
                    placeholder="Reason"
                    showSearch={false}
                    className="w-full sm:w-40"
                />
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-accent-red/10 border border-accent-red/30 rounded-lg text-accent-red mb-4">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
                </div>
            )}

            {/* Contact List */}
            {!loading && !error && (
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* List */}
                    <div className={`flex-1 space-y-2 ${selectedContact ? 'hidden lg:block' : ''}`}>
                        {filteredContacts.length === 0 ? (
                            <div className="p-8 text-center text-text-tertiary bg-bg-card border border-border rounded-xl">
                                {contacts.length === 0 ? 'No contact submissions yet' : 'No contacts match your filters'}
                            </div>
                        ) : (
                            filteredContacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`p-4 cursor-pointer transition-colors border-b border-border ${selectedContact?.id === contact.id
                                        ? 'bg-accent-primary/10'
                                        : 'hover:bg-bg-tertiary/30'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-text-primary truncate">
                                                {contact.firstName} {contact.lastName}
                                            </div>
                                            <div className="text-sm text-text-tertiary truncate">{contact.email}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(contact.status)}`}>
                                            {contact.status || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-text-tertiary">
                                        <span className="px-2 py-0.5 bg-bg-tertiary rounded capitalize">{contact.reason?.replace('_', ' ')}</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatDate(contact.timestamp)}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-text-secondary line-clamp-2">{contact.query}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Detail Panel */}
                    {selectedContact && (
                        <div className="lg:w-[400px] bg-bg-card border border-border rounded-xl p-6 lg:sticky lg:top-4 lg:h-fit">
                            {/* Mobile Back Button */}
                            <button
                                onClick={() => setSelectedContact(null)}
                                className="lg:hidden text-sm text-accent-primary mb-4"
                            >
                                ← Back to list
                            </button>

                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary">
                                        {selectedContact.firstName} {selectedContact.lastName}
                                    </h2>
                                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(selectedContact.status)}`}>
                                        {selectedContact.status || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-6">
                                <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-primary transition-colors">
                                    <Mail size={16} className="text-text-tertiary" />
                                    {selectedContact.email}
                                </a>
                                {selectedContact.phone && (
                                    <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-primary transition-colors">
                                        <Phone size={16} className="text-text-tertiary" />
                                        {selectedContact.phone}
                                    </a>
                                )}
                                {selectedContact.company && (
                                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                                        <Building2 size={16} className="text-text-tertiary" />
                                        {selectedContact.company}
                                    </div>
                                )}
                                {selectedContact.toolUrl && (
                                    <a href={selectedContact.toolUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-accent-primary hover:underline">
                                        <Link2 size={16} />
                                        {selectedContact.toolUrl}
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>

                            {/* Reason */}
                            <div className="mb-4">
                                <div className="text-xs text-text-tertiary mb-1">Reason</div>
                                <span className="px-3 py-1 bg-accent-primary/10 text-accent-primary text-sm font-medium rounded-lg capitalize">
                                    {selectedContact.reason?.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Message */}
                            <div className="mb-4">
                                <div className="text-xs text-text-tertiary mb-1 flex items-center gap-1">
                                    <MessageSquare size={12} />
                                    Message
                                </div>
                                <div className="p-3 bg-bg-secondary rounded-lg text-sm text-text-primary whitespace-pre-wrap">
                                    {selectedContact.query}
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="text-xs text-text-tertiary space-y-1">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    Submitted: {formatDate(selectedContact.timestamp)}
                                </div>
                                {selectedContact.repliedDate && (
                                    <div className="flex items-center gap-1">
                                        <CheckCircle size={12} className="text-accent-green" />
                                        Replied: {formatDate(selectedContact.repliedDate)}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedContact.notes && (
                                <div className="mt-4 p-3 bg-accent-orange/10 border border-accent-orange/30 rounded-lg">
                                    <div className="text-xs text-accent-orange mb-1 font-medium">Internal Notes</div>
                                    <div className="text-sm text-text-primary">{selectedContact.notes}</div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-6 flex gap-2">
                                <a
                                    href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.reason}`}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors"
                                >
                                    <Mail size={16} />
                                    Reply
                                </a>
                            </div>

                            <p className="mt-4 text-xs text-text-tertiary text-center">
                                Update status & notes in Google Sheets
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
