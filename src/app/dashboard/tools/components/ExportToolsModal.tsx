'use client';

import { useState } from 'react';
import { X, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { AdminTool } from '@/context/AdminContext';

interface ExportToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
    tools: AdminTool[];
}

// All exportable columns grouped - comprehensive list
const EXPORT_COLUMNS = {
    basic: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'app_username', label: 'App Username' },
        { key: 'summary', label: 'Summary' },
        { key: 'description', label: 'Description' },
        { key: 'websiteUrl', label: 'Website URL' },
        { key: 'status', label: 'Status' },
    ],
    pricing: [
        { key: 'pricing', label: 'Pricing Type' },
        { key: 'pricingLabel', label: 'Pricing Label' },
        { key: 'pricingTiers', label: 'Pricing Tiers' },
        { key: 'hasFreeTrial', label: 'Has Free Trial' },
        { key: 'freeTrialDays', label: 'Free Trial Days' },
        { key: 'discount', label: 'Discount' },
        { key: 'billingFrequency', label: 'Billing Frequency' },
    ],
    classification: [
        { key: 'categoryName', label: 'Categories' },
        { key: 'taskName', label: 'Tasks' },
        { key: 'tags', label: 'Tags' },
    ],
    content: [
        { key: 'coreFeatures', label: 'Core Features' },
        { key: 'useCases', label: 'Use Cases' },
        { key: 'pros', label: 'Pros' },
        { key: 'cons', label: 'Cons' },
        { key: 'faq', label: 'FAQ' },
    ],
    media: [
        { key: 'logoUrl', label: 'Logo URL' },
        { key: 'images', label: 'Images' },
        { key: 'videos', label: 'Videos' },
    ],
    links: [
        { key: 'playStoreUrl', label: 'Play Store URL' },
        { key: 'appStoreUrl', label: 'App Store URL' },
        { key: 'socialLinks', label: 'Social Links' },
        { key: 'affiliateUrl', label: 'Affiliate URL' },
        { key: 'affiliateEnabled', label: 'Affiliate Enabled' },
    ],
    stats: [
        { key: 'rating', label: 'Rating' },
        { key: 'saveCount', label: 'Save Count' },
        { key: 'viewCount', label: 'View Count' },
        { key: 'upvotes', label: 'Upvotes' },
        { key: 'downvotes', label: 'Downvotes' },
    ],
    dates: [
        { key: 'released_on', label: 'Release Date' },
        { key: 'releasedAgo', label: 'Released Ago' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'updatedAt', label: 'Updated At' },
        { key: 'scheduledAt', label: 'Scheduled At' },
    ],
    flags: [
        { key: 'isFeatured', label: 'Featured' },
        { key: 'isVerified', label: 'Verified' },
        { key: 'backLinks', label: 'Back Links' },
        { key: 'spotlightEnabled', label: 'Spotlight Enabled' },
        { key: 'spotlightPosition', label: 'Spotlight Position' },
        { key: 'trendingPosition', label: 'Trending Position' },
    ],
    contact: [
        { key: 'contactName', label: 'Contact Name' },
        { key: 'contactEmail', label: 'Contact Email' },
        { key: 'contactMobile', label: 'Contact Mobile' },
        { key: 'contactCompany', label: 'Contact Company' },
        { key: 'contactAddress', label: 'Contact Address' },
    ],
    other: [
        { key: 'alternativeTools', label: 'Alternative Tools' },
        { key: 'references', label: 'References' },
        { key: 'internalNotes', label: 'Internal Notes' },
        { key: 'versionHistory', label: 'Version History' },
    ],
};

const GROUP_LABELS: Record<string, string> = {
    basic: 'Basic Info',
    pricing: 'Pricing',
    classification: 'Categories & Tags',
    content: 'Content',
    media: 'Media',
    links: 'Links & Affiliate',
    stats: 'Stats & Ratings',
    dates: 'Dates',
    flags: 'Flags & Settings',
    contact: 'Contact Info',
    other: 'Other',
};

const ALL_COLUMNS = Object.values(EXPORT_COLUMNS).flat();
const DEFAULT_COLUMNS = new Set(['name', 'summary', 'websiteUrl', 'status', 'pricing', 'categoryName', 'released_on', 'createdAt']);

export default function ExportToolsModal({ isOpen, onClose, tools }: ExportToolsModalProps) {
    const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(DEFAULT_COLUMNS));
    const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

    const toggleColumn = (key: string) => {
        const newSet = new Set(selectedColumns);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelectedColumns(newSet);
    };

    const toggleGroup = (groupKey: string) => {
        const groupColumns = EXPORT_COLUMNS[groupKey as keyof typeof EXPORT_COLUMNS];
        const allSelected = groupColumns.every(col => selectedColumns.has(col.key));
        const newSet = new Set(selectedColumns);

        if (allSelected) {
            groupColumns.forEach(col => newSet.delete(col.key));
        } else {
            groupColumns.forEach(col => newSet.add(col.key));
        }
        setSelectedColumns(newSet);
    };

    const selectAllColumns = () => setSelectedColumns(new Set(ALL_COLUMNS.map(c => c.key)));
    const selectNoColumns = () => setSelectedColumns(new Set());
    const selectDefaultColumns = () => setSelectedColumns(new Set(DEFAULT_COLUMNS));

    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'object') {
                return JSON.stringify(value);
            }
            return value.join(', ');
        }
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return String(value);
    };

    const handleExport = () => {
        if (selectedColumns.size === 0 || tools.length === 0) return;

        const columns = Array.from(selectedColumns);

        if (exportFormat === 'csv') {
            const headers = columns.map(col =>
                ALL_COLUMNS.find(c => c.key === col)?.label || col
            );

            const rows = tools.map(tool =>
                columns.map(col => {
                    const value = tool[col as keyof AdminTool];
                    const formatted = formatValue(value);
                    if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
                        return `"${formatted.replace(/"/g, '""')}"`;
                    }
                    return formatted;
                })
            );

            const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
            downloadBlob(blob, `tools_export_${Date.now()}.csv`);
        } else {
            const data = tools.map(tool => {
                const obj: Record<string, any> = {};
                columns.forEach(col => {
                    obj[col] = tool[col as keyof AdminTool];
                });
                return obj;
            });
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            downloadBlob(blob, `tools_export_${Date.now()}.json`);
        }
        onClose();
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        }, 100);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-bg-secondary/50">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Download size={20} className="text-accent-primary" />
                            Export {tools.length} Tool{tools.length !== 1 ? 's' : ''}
                        </h2>
                        <p className="text-xs text-text-tertiary mt-0.5">
                            Select columns to include in export
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                        <X size={20} className="text-text-tertiary" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {/* Format Selection */}
                    <div>
                        <label className="text-sm font-medium text-text-primary mb-2 block">Export Format</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setExportFormat('csv')}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${exportFormat === 'csv'
                                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                                        : 'border-border bg-bg-secondary text-text-secondary hover:border-text-tertiary'
                                    }`}
                            >
                                <FileSpreadsheet size={20} />
                                <span className="font-medium">CSV</span>
                                <span className="text-xs opacity-70">(Excel)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setExportFormat('json')}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${exportFormat === 'json'
                                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                                        : 'border-border bg-bg-secondary text-text-secondary hover:border-text-tertiary'
                                    }`}
                            >
                                <FileJson size={20} />
                                <span className="font-medium">JSON</span>
                                <span className="text-xs opacity-70">(API)</span>
                            </button>
                        </div>
                    </div>

                    {/* Column Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-text-primary">
                                Select Columns <span className="text-text-tertiary font-normal">({selectedColumns.size} selected)</span>
                            </label>
                            <div className="flex gap-3 text-xs">
                                <button type="button" onClick={selectAllColumns} className="text-accent-primary hover:underline font-medium">All</button>
                                <button type="button" onClick={selectDefaultColumns} className="text-accent-primary hover:underline font-medium">Defaults</button>
                                <button type="button" onClick={selectNoColumns} className="text-accent-primary hover:underline font-medium">Clear</button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {Object.entries(EXPORT_COLUMNS).map(([groupKey, columns]) => {
                                const allSelected = columns.every(col => selectedColumns.has(col.key));
                                const someSelected = columns.some(col => selectedColumns.has(col.key));

                                return (
                                    <div key={groupKey} className="bg-bg-secondary rounded-lg p-3">
                                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={el => {
                                                    if (el) el.indeterminate = someSelected && !allSelected;
                                                }}
                                                onChange={() => toggleGroup(groupKey)}
                                                className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                                            />
                                            <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                                                {GROUP_LABELS[groupKey]}
                                            </span>
                                            <span className="text-xs text-text-tertiary">
                                                ({columns.filter(c => selectedColumns.has(c.key)).length}/{columns.length})
                                            </span>
                                        </label>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 pl-6">
                                            {columns.map(col => (
                                                <label key={col.key} className="flex items-center gap-2 cursor-pointer py-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedColumns.has(col.key)}
                                                        onChange={() => toggleColumn(col.key)}
                                                        className="w-3.5 h-3.5 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                                                    />
                                                    <span className="text-xs text-text-secondary">{col.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-border bg-bg-secondary/30">
                    <p className="text-xs text-text-tertiary">
                        {selectedColumns.size} columns × {tools.length} tools
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={selectedColumns.size === 0}
                            className="flex items-center gap-2 px-5 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Download size={16} />
                            Export {exportFormat.toUpperCase()}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
