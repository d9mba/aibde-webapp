'use client';

import { useState } from 'react';
import { Upload, Download, X, Loader2, Eye, Pencil, Trash2, RefreshCw } from 'lucide-react';
import BulkImportEditModal from './BulkImportEditModal';

interface UpdateTool {
    id?: string;
    app_username?: string;
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
    status?: string;
    [key: string]: any;
}

interface BulkUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateComplete: () => void;
}

/**
 * Render a multi-step modal UI for importing, reviewing, editing, and submitting CSV-driven bulk updates for tools.
 *
 * The component provides:
 * - CSV template download and CSV file upload/parsing.
 * - A review step with per-item selection, preview, inline edit, and delete.
 * - Submission to the bulk-update API and a result summary with error details.
 *
 * @param isOpen - Whether the bulk update modal is visible.
 * @param onClose - Callback invoked when the modal is closed; resets internal state.
 * @param onUpdateComplete - Callback invoked after the server reports created or updated items.
 * @returns The modal's React element when `isOpen` is true, or `null` when closed.
 */
export default function BulkUpdateModal({ isOpen, onClose, onUpdateComplete }: BulkUpdateModalProps) {
    const [updateStep, setUpdateStep] = useState<1 | 2 | 3>(1);
    const [updateTools, setUpdateTools] = useState<UpdateTool[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        updated: number;
        created: number;
        failed: number;
        skipped: number;
        errors: { name: string; error: string }[];
    } | null>(null);

    // Download CSV template for updates
    const downloadTemplate = () => {
        const headers = [
            'id',
            'app_username',
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
            'faq',
            'status'
        ];

        const exampleRow = [
            'uuid-here-or-leave-blank',
            'example-tool-slug',
            'Updated Tool Name',
            'Updated summary',
            '<p>Updated description</p>',
            'Category1,Category2',
            'Task1,Task2',
            'tag1,tag2',
            'https://example.com',
            'freemium',
            'Free with paid plans',
            '4.5',
            '2025-01-15',
            'Feature 1,Feature 2',
            'Use Case 1,Use Case 2',
            'Pro 1,Pro 2',
            'Con 1,Con 2',
            'https://example.com/logo.png',
            'https://example.com/img1.png,https://example.com/img2.png',
            'https://youtube.com/watch?v=abc',
            'https://play.google.com/store/apps/details?id=com.example',
            'https://apps.apple.com/app/example/id123',
            'twitter:https://twitter.com/example',
            'Question 1?::Answer 1;;Question 2?::Answer 2',
            'published'
        ];

        const csvContent = [
            headers.join(','),
            exampleRow.map(val => `"${val.replace(/"/g, '""')}"`).join(',')
        ].join('\r\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'bulk_update_template.csv';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        }, 100);
    };

    // CSV Parser
    const parseCSV = (text: string): UpdateTool[] => {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const result: UpdateTool[] = [];

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

            const obj: Partial<UpdateTool> & { [key: string]: any } = {};
            headers.forEach((header, idx) => {
                let value = row[idx] || '';
                value = value.replace(/^"|"$/g, '').replace(/""/g, '"');
                const key = header.toLowerCase().replace(/\s+/g, '_');
                if (value) obj[key] = value;
            });

            // Must have id, app_username, or name to be valid
            if (obj.id || obj.app_username || obj.name) {
                // Ensure name is always set (required field)
                const toolWithName: UpdateTool = {
                    ...obj,
                    name: obj.name || obj.app_username || obj.id || 'Unknown Tool'
                };
                result.push(toolWithName);
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
                setUpdateTools(tools);
                setSelectedIndices(new Set(tools.map((_, i) => i)));
                setUpdateStep(2);
            } catch (err) {
                alert('Failed to parse CSV');
            }
        };
        reader.readAsText(file);
    };

    const handleBulkUpdate = async () => {
        if (selectedIndices.size === 0) return;

        setLoading(true);
        try {
            const toolsToUpdate = updateTools.filter((_, i) => selectedIndices.has(i));

            const res = await fetch('/api/tools/bulk-update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tools: toolsToUpdate }),
            });

            const data = await res.json();

            if (!res.ok) {
                setResult({
                    updated: 0,
                    created: 0,
                    failed: toolsToUpdate.length,
                    skipped: 0,
                    errors: [{ name: 'API Error', error: data.error || 'Failed to update tools' }]
                });
                setUpdateStep(3);
                return;
            }

            setResult({
                updated: data.updated ?? 0,
                created: data.created ?? 0,
                failed: data.failed ?? 0,
                skipped: data.skipped ?? 0,
                errors: data.errors ?? []
            });
            setUpdateStep(3);
            if ((data.updated ?? 0) > 0 || (data.created ?? 0) > 0) {
                onUpdateComplete();
            }
        } catch (err: any) {
            const toolsToUpdate = updateTools.filter((_, i) => selectedIndices.has(i));
            setResult({
                updated: 0,
                created: 0,
                failed: toolsToUpdate.length,
                skipped: 0,
                errors: [{ name: 'Error', error: err.message || 'An unexpected error occurred' }]
            });
            setUpdateStep(3);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndices(newSet);
    };

    const toggleAllSelection = () => {
        if (selectedIndices.size === updateTools.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(updateTools.map((_, i) => i)));
        }
    };

    const updateTool = (index: number, updates: Partial<UpdateTool>) => {
        setUpdateTools(prev => prev.map((tool, i) =>
            i === index ? { ...tool, ...updates } : tool
        ));
    };

    const deleteTool = (index: number) => {
        setUpdateTools(prev => prev.filter((_, i) => i !== index));
        setSelectedIndices(prev => {
            const newSet = new Set<number>();
            prev.forEach(i => {
                if (i < index) newSet.add(i);
                else if (i > index) newSet.add(i - 1);
            });
            return newSet;
        });
        if (editingIndex === index) setEditingIndex(null);
        if (previewIndex === index) setPreviewIndex(null);
    };

    const editingTool = editingIndex !== null ? updateTools[editingIndex] : null;
    const previewingTool = previewIndex !== null ? updateTools[previewIndex] : null;

    const handleClose = () => {
        setUpdateStep(1);
        setUpdateTools([]);
        setResult(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Bulk Update Modal */}
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <RefreshCw size={20} className="text-accent-primary" />
                            Bulk Update Tools
                        </h2>
                        <button onClick={handleClose} className="p-2 hover:bg-bg-secondary rounded-lg transition-colors">
                            <X size={20} className="text-text-tertiary" />
                        </button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1">
                        {/* Step 1: Upload */}
                        {updateStep === 1 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <RefreshCw size={32} className="text-accent-primary" />
                                </div>
                                <h3 className="text-lg font-medium text-text-primary mb-2">Upload CSV for Bulk Update</h3>
                                <p className="text-text-secondary text-sm mb-2">
                                    Upload a CSV file to update existing tools or create new ones.
                                </p>
                                <p className="text-text-tertiary text-xs mb-6">
                                    Include <code className="bg-bg-secondary px-1 rounded">id</code> or <code className="bg-bg-secondary px-1 rounded">app_username</code> to update existing tools.
                                    <br />
                                    Tools without matching id/slug will be created as new.
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
                        {updateStep === 2 && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-medium text-text-primary">Review Tools to Update</h3>
                                        <p className="text-xs text-text-secondary">Found {updateTools.length} tools. Selected: {selectedIndices.size}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setUpdateStep(1)}
                                            className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleBulkUpdate}
                                            disabled={selectedIndices.size === 0 || loading}
                                            className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading && <Loader2 size={14} className="animate-spin" />}
                                            Update {selectedIndices.size} Tools
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
                                                        checked={selectedIndices.size === updateTools.length && updateTools.length > 0}
                                                        onChange={toggleAllSelection}
                                                        className="rounded border-border text-accent-primary focus:ring-accent-primary"
                                                    />
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Name / Slug</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Type</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-text-secondary uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {updateTools.map((tool, i) => (
                                                <tr key={i} className={`hover:bg-bg-secondary/50 ${!selectedIndices.has(i) ? 'opacity-50' : ''}`}>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIndices.has(i)}
                                                            onChange={() => toggleSelection(i)}
                                                            className="rounded border-border text-accent-primary focus:ring-accent-primary"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium text-text-primary">{tool.name || tool.app_username || tool.id}</div>
                                                        {tool.app_username && tool.name && (
                                                            <div className="text-xs text-text-tertiary">{tool.app_username}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {tool.id || tool.app_username ? (
                                                            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-medium">Update</span>
                                                        ) : (
                                                            <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full font-medium">New</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => setPreviewIndex(i)}
                                                                className="p-1.5 text-text-tertiary hover:text-accent-primary hover:bg-bg-tertiary rounded transition-colors"
                                                                title="Preview"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingIndex(i)}
                                                                className="p-1.5 text-text-tertiary hover:text-accent-primary hover:bg-bg-tertiary rounded transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteTool(i)}
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
                        {updateStep === 3 && result && (
                            <div className="py-6">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${result.failed === 0 ? 'bg-green-100 text-green-600' :
                                    (result.updated + result.created) === 0 ? 'bg-red-100 text-red-600' :
                                        'bg-orange-100 text-orange-600'
                                    }`}>
                                    <RefreshCw size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-text-primary mb-2 text-center">
                                    {result.failed === 0 ? 'Update Successful!' :
                                        (result.updated + result.created) === 0 ? 'Update Failed' :
                                            'Partial Update'}
                                </h3>

                                {/* Summary Stats */}
                                <div className="flex justify-center gap-6 mb-6">
                                    {result.updated > 0 && (
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                                            <div className="text-xs text-text-tertiary">Updated</div>
                                        </div>
                                    )}
                                    {result.created > 0 && (
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-accent-green">{result.created}</div>
                                            <div className="text-xs text-text-tertiary">Created</div>
                                        </div>
                                    )}
                                    {result.skipped > 0 && (
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-text-tertiary">{result.skipped}</div>
                                            <div className="text-xs text-text-tertiary">Skipped</div>
                                        </div>
                                    )}
                                    {result.failed > 0 && (
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-accent-red">{result.failed}</div>
                                            <div className="text-xs text-text-tertiary">Failed</div>
                                        </div>
                                    )}
                                </div>

                                {/* Error Details */}
                                {result.errors.length > 0 && (
                                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 text-left max-w-xl mx-auto mb-6 max-h-[250px] overflow-y-auto">
                                        <h4 className="font-semibold text-accent-red mb-3 text-sm flex items-center gap-2">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            {result.errors.length} Error{result.errors.length > 1 ? 's' : ''}:
                                        </h4>
                                        <ul className="space-y-2">
                                            {result.errors.map((err, i) => (
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
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewIndex !== null && previewingTool && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-lg font-bold text-text-primary">Preview: {previewingTool.name || previewingTool.app_username}</h2>
                            <button onClick={() => setPreviewIndex(null)} className="p-2 hover:bg-bg-secondary rounded-lg transition-colors">
                                <X size={20} className="text-text-tertiary" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {previewingTool.id && (
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-text-tertiary uppercase">ID</label>
                                        <p className="text-sm text-text-primary mt-1 font-mono">{previewingTool.id}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Name</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Slug</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.app_username || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Summary</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.summary || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Categories</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.categories || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Tasks</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.tasks || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Pricing</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.pricing || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Status</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.status || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-medium text-text-tertiary uppercase">Tags</label>
                                    <p className="text-sm text-text-primary mt-1">{previewingTool.tags || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-border">
                            <button
                                onClick={() => {
                                    setEditingIndex(previewIndex);
                                    setPreviewIndex(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary"
                            >
                                <Pencil size={14} className="inline mr-1" /> Edit
                            </button>
                            <button
                                onClick={() => setPreviewIndex(null)}
                                className="px-4 py-2 text-sm font-medium text-white bg-accent-primary rounded-lg hover:bg-accent-primary/90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal - reuse BulkImportEditModal */}
            {editingIndex !== null && editingTool && (
                <BulkImportEditModal
                    isOpen={true}
                    tool={editingTool}
                    toolIndex={editingIndex}
                    onUpdate={updateTool}
                    onDelete={deleteTool}
                    onClose={() => setEditingIndex(null)}
                />
            )}
        </>
    );
}