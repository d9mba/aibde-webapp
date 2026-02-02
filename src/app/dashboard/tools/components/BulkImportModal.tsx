'use client';

import { useState } from 'react';
import { Upload, Download, X, Loader2, Eye, Pencil, Trash2 } from 'lucide-react';
import BulkImportEditModal from './BulkImportEditModal';

// Helper function to get import result status styling
function getImportResultStatus(failed: number, success: number): { iconClass: string; title: string } {
    if (failed === 0) return { iconClass: 'bg-green-100 text-green-600', title: 'Import Successful!' };
    if (success === 0) return { iconClass: 'bg-red-100 text-red-600', title: 'Import Failed' };
    return { iconClass: 'bg-orange-100 text-orange-600', title: 'Partial Import' };
}

interface ImportedTool {
    name: string;
    summary?: string;
    description?: string;
    website?: string;
    websiteUrl?: string;
    categories?: string | string[];
    tasks?: string | string[];
    tags?: string | string[];
    pricing?: string;
    pricing_label?: string;
    pricingLabel?: string;
    rating?: string | number;
    released_on?: string;
    core_features?: string | string[];
    use_cases?: string | string[];
    pros?: string | string[];
    cons?: string | string[];
    logo_url?: string;
    logoUrl?: string;
    images?: string | string[];
    videos?: string | string[];
    play_store_url?: string;
    playStoreUrl?: string;
    app_store_url?: string;
    appStoreUrl?: string;
    social_links?: string;
    socialLinks?: string;
    faq?: string;
    [key: string]: any;
}

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
    const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
    const [importedTools, setImportedTools] = useState<ImportedTool[]>([]);
    const [selectedImportIndices, setSelectedImportIndices] = useState<Set<number>>(new Set());
    const [editingImportIndex, setEditingImportIndex] = useState<number | null>(null);
    const [previewImportIndex, setPreviewImportIndex] = useState<number | null>(null);
    const [bulkImportLoading, setBulkImportLoading] = useState(false);
    const [bulkImportResult, setBulkImportResult] = useState<{ success: number; failed: number; errors: { name: string; error: string }[] } | null>(null);

    // Download CSV template
    const downloadTemplate = () => {
        const headers = [
            'name',
            'summary',
            'description',
            'categories',
            'tasks',
            'tags',
            'website',
            'pricing',
            'pricing_label',
            'rating',
            'released_on',
            'core_features',
            'use_cases',
            'pros',
            'cons',
            'logo_url',
            'images',
            'videos',
            'play_store_url',
            'app_store_url',
            'social_links',
            'faq'
        ];

        const exampleRow = [
            'Example Tool',
            'A short summary of the tool',
            '<p>A longer <strong>rich text</strong> description of what the tool does.</p>',
            'Developer Tools,Productivity',
            'Code Generation,Automation',
            'ai,coding,automation',
            'https://example.com',
            'freemium',
            'Free with paid plans',
            '4.5',
            '2025-01-15',
            'Core Feature 1,Core Feature 2,Core Feature 3',
            'Use Case 1,Use Case 2',
            'Pro 1,Pro 2,Pro 3',
            'Con 1,Con 2',
            'https://example.com/logo.png',
            'https://example.com/screenshot1.png,https://example.com/screenshot2.png',
            'https://youtube.com/watch?v=abc123',
            'https://play.google.com/store/apps/details?id=com.example',
            'https://apps.apple.com/app/example/id123456789',
            'twitter:https://twitter.com/example,linkedin:https://linkedin.com/company/example',
            'What is this tool?::This is an example AI tool.;;How much does it cost?::It has a free tier.'
        ];

        const csvContent = [
            headers.join(','),
            exampleRow.map(val => `"${val.replace(/"/g, '""')}"`).join(',')
        ].join('\r\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv' });

        // Create a link and trigger download
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = 'bulk_import_template.csv';

        // Append to body, click, and cleanup
        document.body.appendChild(link);
        link.click();

        // Cleanup after a short delay
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    // CSV Parser
    const parseCSV = (text: string): ImportedTool[] => {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const result: ImportedTool[] = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const row: string[] = [];
            let inQuote = false;
            let currentCell = '';

            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    row.push(currentCell.trim());
                    currentCell = '';
                } else {
                    currentCell += char;
                }
            }
            row.push(currentCell.trim());

            const obj: ImportedTool = { name: '' };
            headers.forEach((header, idx) => {
                let value = row[idx] || '';
                value = value.replace(/^"|"$/g, '').replace(/""/g, '"');
                const key = header.toLowerCase().replace(/\s+/g, '_');
                obj[key] = value;
            });

            if (obj.name) {
                result.push(obj);
            }
        }
        return result;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const tools = parseCSV(text);
                setImportedTools(tools);
                setSelectedImportIndices(new Set(tools.map((_, i) => i)));
                setImportStep(2);
            } catch (err) {
                alert('Failed to parse CSV');
            }
        };
        reader.readAsText(file);
    };

    const handleBulkSubmit = async () => {
        if (selectedImportIndices.size === 0) return;

        setBulkImportLoading(true);
        try {
            const toolsToImport = importedTools.filter((_, i) => selectedImportIndices.has(i));

            const res = await fetch('/api/tools/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tools: toolsToImport }),
            });

            const data = await res.json();

            if (!res.ok) {
                // API-level error (auth, server error, etc.) - show in result screen
                setBulkImportResult({
                    success: 0,
                    failed: toolsToImport.length,
                    errors: [{ name: 'API Error', error: data.error || 'Failed to import tools' }]
                });
                setImportStep(3);
                return;
            }

            setBulkImportResult({
                success: data.success ?? 0,
                failed: data.failed ?? 0,
                errors: data.errors ?? []
            });
            setImportStep(3);
            if (data.success > 0) {
                onImportComplete();
            }
        } catch (err: any) {
            // Network error or unexpected error - show in result screen
            const toolsToImport = importedTools.filter((_, i) => selectedImportIndices.has(i));
            setBulkImportResult({
                success: 0,
                failed: toolsToImport.length,
                errors: [{ name: 'Error', error: err.message || 'An unexpected error occurred' }]
            });
            setImportStep(3);
        } finally {
            setBulkImportLoading(false);
        }
    };

    const toggleImportSelection = (index: number) => {
        const newSet = new Set(selectedImportIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedImportIndices(newSet);
    };

    const toggleAllImportSelection = () => {
        if (selectedImportIndices.size === importedTools.length) {
            setSelectedImportIndices(new Set());
        } else {
            setSelectedImportIndices(new Set(importedTools.map((_, i) => i)));
        }
    };

    const updateImportedTool = (index: number, updates: Partial<ImportedTool>) => {
        setImportedTools(prev => prev.map((tool, i) =>
            i === index ? { ...tool, ...updates } : tool
        ));
    };

    const deleteImportedTool = (index: number) => {
        setImportedTools(prev => prev.filter((_, i) => i !== index));
        setSelectedImportIndices(prev => {
            const newSet = new Set<number>();
            prev.forEach(i => {
                if (i < index) newSet.add(i);
                else if (i > index) newSet.add(i - 1);
            });
            return newSet;
        });
        if (editingImportIndex === index) setEditingImportIndex(null);
        if (previewImportIndex === index) setPreviewImportIndex(null);
    };

    const editingTool = editingImportIndex !== null ? importedTools[editingImportIndex] : null;
    const previewingTool = previewImportIndex !== null ? importedTools[previewImportIndex] : null;

    const handleClose = () => {
        setImportStep(1);
        setImportedTools([]);
        setBulkImportResult(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Bulk Import Modal */}
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="text-lg font-bold text-text-primary">Bulk Import Tools</h2>
                        <button onClick={handleClose} className="p-2 hover:bg-bg-secondary rounded-lg transition-colors">
                            <X size={20} className="text-text-tertiary" />
                        </button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1">
                        {/* Step 1: Upload */}
                        {importStep === 1 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Upload size={32} className="text-accent-primary" />
                                </div>
                                <h3 className="text-lg font-medium text-text-primary mb-2">Upload CSV File</h3>
                                <p className="text-text-secondary text-sm mb-6">
                                    Upload a CSV file containing your tools. Make sure to use the correct format.
                                </p>
                                <div className="flex flex-col items-center gap-4">
                                    <label className="px-6 py-3 bg-accent-primary text-white rounded-lg font-medium cursor-pointer hover:bg-accent-primary/90 transition-colors">
                                        Choose File
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm text-accent-primary hover:underline">
                                        <Download size={14} /> Download Template
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Preview & Selection */}
                        {importStep === 2 && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-medium text-text-primary">Select Tools to Import</h3>
                                        <p className="text-xs text-text-secondary">Found {importedTools.length} tools. Selected: {selectedImportIndices.size}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setImportStep(1)}
                                            className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleBulkSubmit}
                                            disabled={selectedImportIndices.size === 0 || bulkImportLoading}
                                            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {bulkImportLoading && <Loader2 size={14} className="animate-spin" />}
                                            Import {selectedImportIndices.size} Tools
                                        </button>
                                    </div>
                                </div>

                                <div className="border border-border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-bg-secondary sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedImportIndices.size === importedTools.length && importedTools.length > 0}
                                                        onChange={toggleAllImportSelection}
                                                        className="rounded border-border text-accent-primary focus:ring-accent-primary"
                                                    />
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Summary</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {importedTools.map((tool, i) => (
                                                <tr key={i} className={`hover:bg-bg-secondary/50 ${!selectedImportIndices.has(i) ? 'opacity-50' : ''}`}>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedImportIndices.has(i)}
                                                            onChange={() => toggleImportSelection(i)}
                                                            className="rounded border-border text-accent-primary focus:ring-accent-primary"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 font-medium text-text-primary">{tool.name}</td>
                                                    <td className="px-4 py-2 text-text-secondary truncate max-w-[200px]">{tool.summary}</td>
                                                    <td className="px-4 py-2">
                                                        <span className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-600 rounded-full font-medium">Pending</span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => setPreviewImportIndex(i)}
                                                                className="p-1.5 text-text-tertiary hover:text-accent-primary hover:bg-bg-tertiary rounded transition-colors"
                                                                title="Preview"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingImportIndex(i)}
                                                                className="p-1.5 text-text-tertiary hover:text-accent-primary hover:bg-bg-tertiary rounded transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteImportedTool(i)}
                                                                className="p-1.5 text-text-tertiary hover:text-accent-red hover:bg-red-500/10 rounded transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Result */}
                        {importStep === 3 && bulkImportResult && (() => {
                            const { iconClass, title } = getImportResultStatus(bulkImportResult.failed, bulkImportResult.success);
                            return (
                                <div className="py-6">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${iconClass}`}>
                                        <Upload size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-text-primary mb-2 text-center">
                                        {title}
                                    </h3>

                                    {/* Summary Stats */}
                                    <div className="flex justify-center gap-6 mb-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-accent-green">{bulkImportResult.success}</div>
                                            <div className="text-xs text-text-tertiary">Imported</div>
                                        </div>
                                        {bulkImportResult.failed > 0 && (
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-accent-red">{bulkImportResult.failed}</div>
                                                <div className="text-xs text-text-tertiary">Failed</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Error Details */}
                                    {bulkImportResult.errors.length > 0 && (
                                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 text-left max-w-xl mx-auto mb-6 max-h-[250px] overflow-y-auto">
                                            <h4 className="font-semibold text-accent-red mb-3 text-sm flex items-center gap-2">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                                {bulkImportResult.errors.length} Error{bulkImportResult.errors.length > 1 ? 's' : ''}:
                                            </h4>
                                            <ul className="space-y-2">
                                                {bulkImportResult.errors.map((err, i) => (
                                                    <li key={i} className="text-sm rounded p-2 border bg-bg-card border-red-300 dark:border-red-500/30">
                                                        <span className="font-semibold text-accent-red">{err.name}:</span>{' '}
                                                        <span className="text-text-primary">{err.error}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <button
                                            onClick={handleClose}
                                            className="px-6 py-2 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewImportIndex !== null && previewingTool && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-lg font-bold text-text-primary">Preview: {previewingTool.name}</h2>
                            <button onClick={() => setPreviewImportIndex(null)} className="p-2 hover:bg-bg-secondary rounded-lg transition-colors">
                                <X size={20} className="text-text-tertiary" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Logo Preview */}
                                {(previewingTool.logo_url || previewingTool.logoUrl) && (
                                    <div className="col-span-2 flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-bg-secondary overflow-hidden">
                                            <img
                                                src={previewingTool.logo_url || previewingTool.logoUrl}
                                                alt="Logo"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-text-tertiary uppercase">Logo URL</label>
                                            <p className="text-sm text-text-primary mt-1 truncate max-w-md">{previewingTool.logo_url || previewingTool.logoUrl}</p>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Name</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Website</label>
                                    <p className="text-sm text-text-primary mt-1 truncate">{previewingTool.website || previewingTool.websiteUrl || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Summary</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.summary || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Description</label>
                                    <div className="text-sm text-text-primary mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewingTool.description || '-' }} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Categories</label>
                                    <p className="text-sm text-text-primary mt-1">{Array.isArray(previewingTool.categories) ? previewingTool.categories.join(', ') : previewingTool.categories || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Tasks</label>
                                    <p className="text-sm text-text-primary mt-1">{Array.isArray(previewingTool.tasks) ? previewingTool.tasks.join(', ') : previewingTool.tasks || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Tags</label>
                                    <p className="text-sm text-text-primary mt-1">{Array.isArray(previewingTool.tags) ? previewingTool.tags.join(', ') : previewingTool.tags || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Pricing</label>
                                    <p className="text-sm text-text-primary mt-1 capitalize">{previewingTool.pricing || 'freemium'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Pricing Label</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.pricing_label || previewingTool.pricingLabel || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Rating</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.rating || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Release Date</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.released_on || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Images (URLs)</label>
                                    <p className="text-sm text-text-primary mt-1 break-all">{Array.isArray(previewingTool.images) ? previewingTool.images.join(', ') : previewingTool.images || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Videos (URLs)</label>
                                    <p className="text-sm text-text-primary mt-1 break-all">{Array.isArray(previewingTool.videos) ? previewingTool.videos.join(', ') : previewingTool.videos || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">App Store URLs</label>
                                    <div className="text-sm text-text-primary mt-1 space-y-1">
                                        {(previewingTool.play_store_url || previewingTool.playStoreUrl) && (
                                            <p className="truncate"><span className="text-text-tertiary">Play Store:</span> {previewingTool.play_store_url || previewingTool.playStoreUrl}</p>
                                        )}
                                        {(previewingTool.app_store_url || previewingTool.appStoreUrl) && (
                                            <p className="truncate"><span className="text-text-tertiary">App Store:</span> {previewingTool.app_store_url || previewingTool.appStoreUrl}</p>
                                        )}
                                        {!previewingTool.play_store_url && !previewingTool.playStoreUrl && !previewingTool.app_store_url && !previewingTool.appStoreUrl && '-'}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Social Links</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.social_links || previewingTool.socialLinks || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">FAQ</label>
                                    <p className="text-sm text-text-primary mt-1 whitespace-pre-wrap">{previewingTool.faq || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Core Features</label>
                                    <p className="text-sm text-text-primary mt-1">{Array.isArray(previewingTool.core_features) ? previewingTool.core_features.join(', ') : previewingTool.core_features || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Use Cases</label>
                                    <p className="text-sm text-text-primary mt-1">{Array.isArray(previewingTool.use_cases) ? previewingTool.use_cases.join(', ') : previewingTool.use_cases || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Pros</label>
                                    <p className="text-sm text-text-primary mt-1">{Array.isArray(previewingTool.pros) ? previewingTool.pros.join(', ') : previewingTool.pros || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Cons</label>
                                    <p className="text-sm text-text-primary mt-1">{Array.isArray(previewingTool.cons) ? previewingTool.cons.join(', ') : previewingTool.cons || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-border">
                            <button
                                onClick={() => {
                                    setEditingImportIndex(previewImportIndex);
                                    setPreviewImportIndex(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary"
                            >
                                <Pencil size={14} className="inline mr-1" /> Edit
                            </button>
                            <button
                                onClick={() => setPreviewImportIndex(null)}
                                className="px-4 py-2 text-sm font-medium text-white bg-accent-primary rounded-lg hover:bg-accent-primary/90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingImportIndex !== null && editingTool && (
                <BulkImportEditModal
                    isOpen={true}
                    tool={editingTool}
                    toolIndex={editingImportIndex}
                    onUpdate={updateImportedTool}
                    onDelete={deleteImportedTool}
                    onClose={() => setEditingImportIndex(null)}
                />
            )}
        </>
    );
}
