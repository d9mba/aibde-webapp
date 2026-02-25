'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { Input, Section, ListEditor, Combobox, RichTextEditor, MediaUpload, SearchableSelect } from '@/components/ui';

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
    launched_on?: string;
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

interface BulkImportEditModalProps {
    isOpen: boolean;
    tool: ImportedTool;
    toolIndex: number;
    onUpdate: (index: number, updates: Partial<ImportedTool>) => void;
    onDelete: (index: number) => void;
    onClose: () => void;
}

// Helper to ensure array format
function ensureArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(',').map(s => s.trim()).filter(Boolean);
}

// FAQ type and helpers
interface FAQItem {
    question: string;
    answer: string;
}

function parseFAQ(faqString: string | undefined): FAQItem[] {
    if (!faqString) return [];
    return faqString.split(';;').map(item => {
        const [question, answer] = item.split('::');
        return { question: question?.trim() || '', answer: answer?.trim() || '' };
    }).filter(item => item.question || item.answer);
}

function stringifyFAQ(items: FAQItem[]): string {
    return items.map(item => `${item.question}::${item.answer}`).join(';;');
}

// FAQ Editor Component
function FAQEditor({ items, onChange }: { items: FAQItem[]; onChange: (items: FAQItem[]) => void }) {
    const [q, setQ] = useState('');
    const [a, setA] = useState('');

    const add = () => {
        if (q.trim() && a.trim()) {
            onChange([...items, { question: q.trim(), answer: a.trim() }]);
            setQ('');
            setA('');
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">FAQ</label>
            <div className="space-y-2 mb-3">
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Question"
                    className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary"
                />
                <textarea
                    value={a}
                    onChange={e => setA(e.target.value)}
                    placeholder="Answer"
                    rows={2}
                    className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary resize-none"
                />
                <button type="button" onClick={add} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm">
                    Add FAQ
                </button>
            </div>
            {items.map((faq, i) => (
                <div key={i} className="p-3 bg-bg-secondary rounded-lg mb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="font-medium text-text-primary text-sm">{faq.question}</p>
                            <p className="text-text-secondary text-sm mt-1">{faq.answer}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onChange(items.filter((_, j) => j !== i))}
                            className="text-text-tertiary hover:text-accent-red ml-2"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function BulkImportEditModal({
    isOpen,
    tool,
    toolIndex,
    onUpdate,
    onDelete,
    onClose,
}: BulkImportEditModalProps) {
    const { categories, tasks, tags, addCategory, addTask, addTag } = useAdmin();

    if (!isOpen) return null;

    const handleUpdate = (updates: Partial<ImportedTool>) => {
        onUpdate(toolIndex, updates);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-bg-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary">Edit Tool: {tool.name || 'New Tool'}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onDelete(toolIndex)}
                            className="px-3 py-1.5 text-sm font-medium text-accent-red hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-bg-secondary rounded-lg transition-colors">
                            <X size={20} className="text-text-tertiary" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {/* 1. Basic Settings */}
                    <Section title="1. Basic Settings">
                        <div className="space-y-4">
                            <Input
                                label="Name of Tool"
                                required
                                value={tool.name || ''}
                                onChange={(e) => handleUpdate({ name: e.target.value })}
                            />
                            <Input
                                label="Summary"
                                required
                                value={tool.summary || ''}
                                onChange={(e) => handleUpdate({ summary: e.target.value })}
                                maxLength={200}
                            />
                            <MediaUpload
                                label="App Logo"
                                uploadType="logo"
                                toolName={tool.name || 'tool'}
                                value={tool.logo_url || tool.logoUrl || ''}
                                onChange={(url) => handleUpdate({ logo_url: url, logoUrl: url })}
                            />
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
                                <RichTextEditor
                                    value={tool.description || ''}
                                    onChange={(val) => handleUpdate({ description: val })}
                                    placeholder="Detailed description..."
                                />
                            </div>
                            <Input
                                label="Website Link"
                                type="url"
                                value={tool.website || tool.websiteUrl || ''}
                                onChange={(e) => handleUpdate({ website: e.target.value, websiteUrl: e.target.value })}
                            />
                            <Input
                                label="Launched On"
                                type="date"
                                value={tool.launched_on || tool.released_on || ''}
                                onChange={(e) => handleUpdate({ launched_on: e.target.value })}
                            />
                        </div>
                    </Section>

                    {/* 2. Categories & Classification */}
                    <Section title="2. Categories & Classification">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Combobox
                                label="Categories"
                                required
                                multiple
                                value={ensureArray(tool.categories)}
                                onChange={(val) => handleUpdate({ categories: val })}
                                options={Array.from(new Set(categories.filter(c => c.categoryName).map(c => c.categoryName))).map(name => ({ value: name, label: name }))}
                                allowCreate={true}
                                onCreateNew={async (categoryName) => {
                                    await addCategory({ categoryName, count: 0, description: '' });
                                }}
                            />
                            <Combobox
                                label="Tasks"
                                required
                                multiple
                                value={ensureArray(tool.tasks)}
                                onChange={(val) => handleUpdate({ tasks: val })}
                                options={Array.from(new Set(tasks.filter(t => t.taskName).map(t => t.taskName))).map(name => ({ value: name, label: name }))}
                                allowCreate={true}
                                onCreateNew={async (taskName) => {
                                    await addTask({ taskName, count: 0, description: '' });
                                }}
                            />
                        </div>
                        <div className="mt-4">
                            <Combobox
                                label="Tags"
                                multiple
                                value={ensureArray(tool.tags)}
                                onChange={(val) => handleUpdate({ tags: val })}
                                options={Array.from(new Set(tags.filter(t => t.tagName).map(t => t.tagName))).map(name => ({ value: name, label: name }))}
                                placeholder="Search or add tags..."
                                allowCreate={true}
                                onCreateNew={async (tagName) => {
                                    await addTag({ tagName, count: 0 });
                                }}
                            />
                        </div>
                    </Section>

                    {/* 3. Pricing */}
                    <Section title="3. Pricing">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Pricing Model</label>
                                <SearchableSelect
                                    value={tool.pricing || 'freemium'}
                                    onChange={(val) => handleUpdate({ pricing: val })}
                                    options={[
                                        { value: 'free', label: 'Free' },
                                        { value: 'freemium', label: 'Freemium' },
                                        { value: 'paid', label: 'Paid' },
                                        { value: 'open_source', label: 'Open Source' },
                                    ]}
                                    showSearch={false}
                                />
                            </div>
                            <Input
                                label="Pricing Label"
                                value={tool.pricing_label || tool.pricingLabel || ''}
                                onChange={(e) => handleUpdate({ pricing_label: e.target.value, pricingLabel: e.target.value })}
                                placeholder="From $20/mo"
                            />
                            <Input
                                label="Rating"
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={tool.rating || ''}
                                onChange={(e) => handleUpdate({ rating: e.target.value })}
                                placeholder="4.5"
                            />
                        </div>
                    </Section>

                    {/* 4. Features & Content */}
                    <Section title="4. Features & Content">
                        <div className="space-y-4">
                            <ListEditor
                                label="Core Features"
                                items={ensureArray(tool.core_features)}
                                onChange={(val) => handleUpdate({ core_features: val })}
                                placeholder="Add a feature..."
                            />
                            <ListEditor
                                label="Use Cases"
                                items={ensureArray(tool.use_cases)}
                                onChange={(val) => handleUpdate({ use_cases: val })}
                                placeholder="Add a use case..."
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <ListEditor
                                    label="Pros"
                                    items={ensureArray(tool.pros)}
                                    onChange={(val) => handleUpdate({ pros: val })}
                                    placeholder="Add a pro..."
                                />
                                <ListEditor
                                    label="Cons"
                                    items={ensureArray(tool.cons)}
                                    onChange={(val) => handleUpdate({ cons: val })}
                                    placeholder="Add a con..."
                                />
                            </div>
                        </div>
                    </Section>

                    {/* 5. Media */}
                    <Section title="5. Media">
                        <div className="space-y-4">
                            <MediaUpload
                                label="Screenshots / Images"
                                uploadType="image"
                                toolName={tool.name || 'tool'}
                                multiple={true}
                                items={ensureArray(tool.images)}
                                onItemsChange={(items) => handleUpdate({ images: items })}
                                showAltText={false}
                            />
                            <MediaUpload
                                label="Videos"
                                uploadType="video"
                                mediaType="video"
                                accept="video/*"
                                toolName={tool.name || 'tool'}
                                multiple={true}
                                items={ensureArray(tool.videos)}
                                onItemsChange={(items) => handleUpdate({ videos: items })}
                                showAltText={false}
                            />
                        </div>
                    </Section>

                    {/* 6. App Store Links */}
                    <Section title="6. App Store Links" defaultOpen={false}>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Play Store URL"
                                type="url"
                                value={tool.play_store_url || tool.playStoreUrl || ''}
                                onChange={(e) => handleUpdate({ play_store_url: e.target.value })}
                                placeholder="https://play.google.com/..."
                            />
                            <Input
                                label="App Store URL"
                                type="url"
                                value={tool.app_store_url || tool.appStoreUrl || ''}
                                onChange={(e) => handleUpdate({ app_store_url: e.target.value })}
                                placeholder="https://apps.apple.com/..."
                            />
                        </div>
                        <div className="mt-4">
                            <Input
                                label="Social Links"
                                value={tool.social_links || tool.socialLinks || ''}
                                onChange={(e) => handleUpdate({ social_links: e.target.value })}
                                placeholder="twitter:url, linkedin:url"
                            />
                        </div>
                    </Section>

                    {/* 7. FAQ */}
                    <Section title="7. FAQ" defaultOpen={false}>
                        <FAQEditor
                            items={parseFAQ(tool.faq)}
                            onChange={(items) => handleUpdate({ faq: stringifyFAQ(items) })}
                        />
                    </Section>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-accent-primary rounded-lg hover:bg-accent-primary/90"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
