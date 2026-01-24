'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { Input, Toggle, Section, ListEditor, Combobox, RichTextEditor, MediaUpload, useToast, SearchableSelect } from '@/components/ui';
import { toolSchema, ToolFormData, defaultToolValues } from './ToolForm/schema';
import FullPreview from './ToolForm/FullPreview';
import { getPricingClass, getPricingLabel } from '@/lib/formatters';

interface ToolFormProps { toolId?: string; }

// Slugify helper
const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// FAQ Editor Component
const FAQEditor = ({ items, onChange }: { items: { question: string; answer: string }[]; onChange: (items: { question: string; answer: string }[]) => void }) => {
    const [q, setQ] = useState('');
    const [a, setA] = useState('');
    const add = () => { if (q.trim() && a.trim()) { onChange([...items, { question: q.trim(), answer: a.trim() }]); setQ(''); setA(''); } };
    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">FAQ</label>
            <div className="space-y-2 mb-3">
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Question" className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary" />
                <textarea value={a} onChange={e => setA(e.target.value)} placeholder="Answer" rows={2} className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary resize-none" />
                <button type="button" onClick={add} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm">Add FAQ</button>
            </div>
            {items.map((faq, i) => (
                <div key={i} className="p-3 bg-bg-secondary rounded-lg mb-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="font-medium text-text-primary text-sm">{faq.question}</p>
                            <p className="text-text-secondary text-sm mt-1">{faq.answer}</p>
                        </div>
                        <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-text-tertiary hover:text-accent-red ml-2">×</button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Pricing Tier Editor Component
const PricingTierEditor = ({ tiers, onChange }: { tiers: any[]; onChange: (tiers: any[]) => void }) => {
    const addTier = () => onChange([...tiers, { name: '', price: '', billingFrequency: 'monthly', features: [], highlighted: false }]);
    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary">Pricing Tiers</label>
                <button type="button" onClick={addTier} className="text-xs text-accent-primary hover:underline">+ Add Tier</button>
            </div>
            {tiers.map((tier, i) => (
                <div key={i} className="p-4 bg-bg-secondary rounded-lg mb-3 border border-border">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-medium text-text-primary">Tier {i + 1}</h4>
                        <button type="button" onClick={() => onChange(tiers.filter((_, j) => j !== i))} className="text-text-tertiary hover:text-accent-red text-xs">Remove</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <input value={tier.name} onChange={e => { const t = [...tiers]; t[i].name = e.target.value; onChange(t); }} placeholder="Tier name" className="px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm" />
                        <input value={tier.price} onChange={e => { const t = [...tiers]; t[i].price = e.target.value; onChange(t); }} placeholder="Price" className="px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm" />
                        <SearchableSelect
                            value={tier.billingFrequency || 'monthly'}
                            onChange={(value) => { const t = [...tiers]; t[i].billingFrequency = value; onChange(t); }}
                            options={[
                                { value: 'monthly', label: 'Monthly' },
                                { value: 'yearly', label: 'Yearly' },
                                { value: 'one-time', label: 'One-time' },
                            ]}
                            showSearch={false}
                            className="flex-1"
                        />
                    </div>
                    <textarea value={(tier.features || []).join('\n')} onChange={e => { const t = [...tiers]; t[i].features = e.target.value.split('\n').filter(Boolean); onChange(t); }} placeholder="Features (one per line)" rows={3} className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm resize-none" />
                    <label className="flex items-center gap-2 mt-2 text-sm text-text-secondary cursor-pointer">
                        <input type="checkbox" checked={tier.highlighted || false} onChange={e => { const t = [...tiers]; t[i].highlighted = e.target.checked; onChange(t); }} className="rounded" />
                        Highlight this tier
                    </label>
                </div>
            ))}
        </div>
    );
};

// Internal Notes Editor
const NotesEditor = ({ notes, onChange }: { notes: { note: string; createdAt: string }[]; onChange: (notes: { note: string; createdAt: string }[]) => void }) => {
    const [note, setNote] = useState('');
    const add = () => { if (note.trim()) { onChange([...notes, { note: note.trim(), createdAt: new Date().toISOString() }]); setNote(''); } };
    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Internal Notes (Admin Only)</label>
            <div className="flex gap-2 mb-3">
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." rows={2} className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm resize-none" />
                <button type="button" onClick={add} className="px-3 py-2 bg-accent-primary text-white rounded-lg text-sm self-end">Add</button>
            </div>
            {notes.map((n, i) => (
                <div key={i} className="p-3 bg-bg-secondary rounded-lg mb-2 flex justify-between">
                    <div>
                        <p className="text-sm text-text-primary">{n.note}</p>
                        <p className="text-xs text-text-tertiary mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    <button type="button" onClick={() => onChange(notes.filter((_, j) => j !== i))} className="text-text-tertiary hover:text-accent-red">×</button>
                </div>
            ))}
        </div>
    );
};

// Version History Editor
const VersionEditor = ({ versions, onChange }: { versions: { version: string; releaseNotes: string; releasedAt: string }[]; onChange: (versions: { version: string; releaseNotes: string; releasedAt: string }[]) => void }) => {
    const [v, setV] = useState({ version: '', releaseNotes: '', releasedAt: '' });
    const add = () => { if (v.version.trim()) { onChange([...versions, { ...v, releasedAt: v.releasedAt || new Date().toISOString().split('T')[0] }]); setV({ version: '', releaseNotes: '', releasedAt: '' }); } };
    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Version History</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
                <input value={v.version} onChange={e => setV({ ...v, version: e.target.value })} placeholder="Version (e.g., 2.0)" className="px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm" />
                <input type="date" value={v.releasedAt} onChange={e => setV({ ...v, releasedAt: e.target.value })} className="px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm" />
                <button type="button" onClick={add} className="px-3 py-2 bg-accent-primary text-white rounded-lg text-sm">Add</button>
            </div>
            <textarea value={v.releaseNotes} onChange={e => setV({ ...v, releaseNotes: e.target.value })} placeholder="Release notes..." rows={2} className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm resize-none mb-3" />
            {versions.map((ver, i) => (
                <div key={i} className="p-3 bg-bg-secondary rounded-lg mb-2 flex justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-primary">v{ver.version} - {ver.releasedAt}</p>
                        <p className="text-sm text-text-secondary mt-1">{ver.releaseNotes}</p>
                    </div>
                    <button type="button" onClick={() => onChange(versions.filter((_, j) => j !== i))} className="text-text-tertiary hover:text-accent-red">×</button>
                </div>
            ))}
        </div>
    );
};

// Multi-Image Upload Component
const MultiImageUpload = ({ label, images, onChange }: {
    label: string; images: string[];
    onChange: (images: string[]) => void;
}) => {
    const [url, setUrl] = useState('');
    const add = () => { if (url.trim()) { onChange([...images, url.trim()]); setUrl(''); } };
    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
            <div className="flex gap-2 mb-3">
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Enter image URL..." className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm" />
                <button type="button" onClick={add} className="px-3 py-2 bg-accent-primary text-white rounded-lg text-sm">Add</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img, i) => (
                    <div key={i} className="relative group">
                        <img src={img} alt={`Image ${i + 1}`} className="w-full h-32 object-cover rounded-lg border border-border" />
                        <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 bg-accent-red text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Live Preview Component (Isolated with useWatch)
const LivePreview = ({ control, categories, onExpand }: { control: any; categories: any[]; onExpand: () => void }) => {
    const values = useWatch({ control });
    const categoryNames = values.categoryName || [];
    const firstCategory = categoryNames[0];

    return (
        <div className="bg-bg-card border border-border rounded-xl p-4 sticky top-4 z-10">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-text-secondary">Live Preview</h3>
                <button type="button" onClick={onExpand} className="text-xs text-accent-primary hover:underline">Full Preview</button>
            </div>
            <div className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-xl bg-bg-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
                    {values.logoUrl ? <img src={values.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-2xl text-text-tertiary">🔧</span>}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-text-primary truncate">{values.name || 'Tool Name'}</h2>
                    <p className="text-sm text-text-secondary line-clamp-2">{values.summary || 'Short summary will appear here...'}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {firstCategory && <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded text-xs">{firstCategory}{categoryNames.length > 1 && ` +${categoryNames.length - 1}`}</span>}
                        {values.pricing && (
                            <span className={`px-2 py-0.5 rounded text-xs ${getPricingClass(values.pricing)}`}>
                                {getPricingLabel(values.pricing)}
                            </span>
                        )}
                        {values.hasFreeTrial && <span className="px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded text-xs">{values.freeTrialDays} day trial</span>}
                    </div>
                </div>
                <a href={values.affiliateEnabled && values.affiliateUrl ? values.affiliateUrl : values.websiteUrl || '#'} target="_blank" rel="noopener noreferrer" className={`px-3 py-1.5 rounded-lg text-sm ${values.websiteUrl ? 'bg-accent-primary text-white' : 'bg-bg-tertiary text-text-tertiary pointer-events-none'}`}>Visit →</a>
            </div>
        </div>
    );
};

export default function ToolForm({ toolId }: ToolFormProps) {
    const router = useRouter();
    const { tools, categories, tasks, tags, addTool, updateTool, addTag, addCategory, addTask, isLoaded } = useAdmin();
    const { showToast, updateToast } = useToast();
    const isEdit = !!toolId;
    const existingTool = isEdit ? tools.find(t => t.id === toolId) : null;

    const [showFullPreview, setShowFullPreview] = useState(false);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

    const { register, control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<ToolFormData>({
        resolver: zodResolver(toolSchema),
        defaultValues: defaultToolValues,
    });

    // Sanitize null values from database to proper defaults for form
    const sanitizeToolData = (tool: AdminTool): ToolFormData => {
        // Fields that should be arrays
        const arrayFields = ['categoryName', 'taskName', 'tags', 'coreFeatures', 'useCases', 'pros', 'cons', 'faq', 'images', 'videos', 'pricingTiers', 'internalNotes', 'versionHistory', 'alternativeTools', 'references'];
        // Fields that should be objects
        const objectFields = ['socialLinks'];

        const sanitized = { ...defaultToolValues };

        for (const key in tool) {
            const value = (tool as any)[key];

            if (value === null || value === undefined) {
                // Use appropriate default based on field type
                if (arrayFields.includes(key)) {
                    (sanitized as any)[key] = [];
                } else if (objectFields.includes(key)) {
                    (sanitized as any)[key] = {};
                } else if (typeof (defaultToolValues as any)[key] === 'boolean') {
                    (sanitized as any)[key] = false;
                } else if (typeof (defaultToolValues as any)[key] === 'number') {
                    (sanitized as any)[key] = 0;
                } else {
                    (sanitized as any)[key] = '';
                }
            } else {
                (sanitized as any)[key] = value;
            }
        }

        return sanitized as ToolFormData;
    };

    useEffect(() => { if (existingTool) reset(sanitizeToolData(existingTool)); }, [existingTool, reset]);

    const watchName = watch('name');
    useEffect(() => {
        if (!isEdit) {
            setValue('slug', slugify(watchName || ''));
            setShowDuplicateWarning(watchName ? !!tools.find(t => (t.name || '').toLowerCase() === watchName.toLowerCase()) : false);
        }
    }, [watchName, isEdit, tools, setValue]);

    // Track and cleanup unsaved uploads
    const UPLOAD_KEY = 'pending_uploads';

    useEffect(() => {
        // Cleanup pending uploads on unmount (cancel/navigate away)
        return () => {
            const pendingUploads = JSON.parse(sessionStorage.getItem(UPLOAD_KEY) || '[]');
            if (pendingUploads.length > 0) {
                fetch('/api/upload/cleanup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ files: pendingUploads }),
                }).catch(console.error);
                sessionStorage.removeItem(UPLOAD_KEY);
            }
        };
    }, []);

    // Track uploaded files globally (called from MediaUpload via context or direct)
    useEffect(() => {
        const handleBeforeUnload = () => {
            const pendingUploads = JSON.parse(sessionStorage.getItem(UPLOAD_KEY) || '[]');
            if (pendingUploads.length > 0) {
                navigator.sendBeacon('/api/upload/cleanup', JSON.stringify({ files: pendingUploads }));
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const onSubmit = async (data: ToolFormData) => {
        // For edits, check if there are actual changes
        if (isEdit && existingTool) {
            const sanitizedExisting = sanitizeToolData(existingTool);

            // Only compare fields that are in the form schema (ignore db-only fields like id, createdAt, updatedAt)
            const formFields = Object.keys(defaultToolValues);

            const getFormFieldsOnly = (obj: any) => {
                const result: any = {};
                formFields.forEach(key => {
                    result[key] = obj[key];
                });
                return result;
            };

            // Deep compare with sorted keys to handle property ordering differences
            const sortedStringify = (obj: any): string => {
                return JSON.stringify(obj, (key, value) => {
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        return Object.keys(value).sort().reduce((sorted: any, k) => {
                            sorted[k] = value[k];
                            return sorted;
                        }, {});
                    }
                    return value;
                });
            };

            const existingFormData = getFormFieldsOnly(sanitizedExisting);
            const newFormData = getFormFieldsOnly(data);

            const existingStr = sortedStringify(existingFormData);
            const newStr = sortedStringify(newFormData);
            const hasChanges = existingStr !== newStr;

            if (!hasChanges) {
                showToast('Tool already up to date - no changes saved', 'info');
                return;
            }
        }

        const statusMessages: Record<string, string> = {
            draft: 'Saving draft',
            pending: 'Submitting for review',
            published: isEdit ? 'Updating' : 'Creating'
        };
        const status = data.status || 'published';
        const statusMsg = statusMessages[status] || (isEdit ? 'Updating' : 'Creating');
        const toastId = showToast(`${statusMsg}...`, 'loading');
        try {
            if (isEdit && toolId) await updateTool(toolId, data);
            else await addTool(data as any);
            // Clear pending uploads on success - they're now saved
            sessionStorage.removeItem(UPLOAD_KEY);

            // Show appropriate success message
            let successMsg = 'Tool updated successfully!';
            if (!isEdit) {
                successMsg = data.status === 'pending'
                    ? 'Tool submitted for review!'
                    : 'Tool saved as draft!';
            }
            updateToast(toastId, successMsg, 'success');
            router.push('/dashboard/tools');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to save:', error);
            updateToast(toastId, errorMessage, 'error');
        }
    };

    if (!isLoaded) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

    const handleSaveAsDraft = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setValue('status', 'draft', { shouldDirty: true });
        // Use handleSubmit with onError callback to show validation errors
        const onError = (errors: any) => {
            console.error('Validation errors:', errors);
            const firstError = Object.values(errors)[0] as any;
            showToast(firstError?.message || 'Please fill in required fields', 'error');
        };
        await handleSubmit(onSubmit, onError)();
    };

    const handleReadyForReview = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setValue('status', 'pending', { shouldDirty: true });
        // Use handleSubmit with onError callback to show validation errors
        const onError = (errors: any) => {
            console.error('Validation errors:', errors);
            const firstError = Object.values(errors)[0] as any;
            showToast(firstError?.message || 'Please fill in required fields', 'error');
        };
        await handleSubmit(onSubmit, onError)();
    };

    // Common form error handler
    const onFormError = (errors: any) => {
        console.error('Form validation errors:', errors);
        const firstError = Object.values(errors)[0] as any;
        showToast(firstError?.message || 'Please fill in required fields', 'error');
    };

    return (
        <form onSubmit={handleSubmit(onSubmit, onFormError)} className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-text-primary">{isEdit ? 'Edit Tool' : 'Add New Tool'}</h1>
                <div className="flex gap-2">
                    <button type="button" onClick={() => router.back()} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary">Cancel</button>
                    <button type="button" onClick={handleSaveAsDraft} disabled={isSubmitting} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save as Draft'}</button>
                    {!isEdit && <button type="button" onClick={handleReadyForReview} disabled={isSubmitting} className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Ready for Review'}</button>}
                    {isEdit && <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Update'}</button>}
                </div>
            </div>

            {showDuplicateWarning && <div className="mb-4 p-3 bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg text-sm text-accent-yellow">⚠️ A tool with this name already exists</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">

                    {/* 1. Basic Settings */}
                    <Section title="1. Basic Settings">
                        <Input label="Name of Tool" required {...register('name')} error={errors.name?.message} />
                        <Input label="App Username" {...register('slug')} placeholder="unique-username" />
                        <Input label="Summary" required {...register('summary')} maxLength={100} error={errors.summary?.message} />
                        <Controller name="logoUrl" control={control} render={({ field }) => <MediaUpload label="App Logo" value={field.value || ''} onChange={field.onChange} uploadType="logo" toolName={watch('name')} />} />
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description <span className="text-accent-red">*</span></label>
                            <Controller name="description" control={control} render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Detailed description..." />} />
                        </div>
                        <Input label="Website Link" required type="url" {...register('websiteUrl')} error={errors.websiteUrl?.message} />
                        <div className="pt-2">
                            <Controller name="affiliateEnabled" control={control} render={({ field }) => <Toggle label="Enable Affiliate URL" checked={field.value || false} onChange={field.onChange} />} />
                            {watch('affiliateEnabled') && (
                                <div className="mt-2">
                                    <Input label="Affiliate URL" type="url" {...register('affiliateUrl')} />
                                    <p className="text-xs text-text-tertiary mt-1">Users will be redirected here instead</p>
                                </div>
                            )}
                        </div>
                        <Input label="Founded Date" type="date" {...register('releasedAt')} />
                    </Section>

                    {/* 2. Categories & Classification */}
                    <Section title="2. Categories & Classification">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller name="categoryName" control={control} render={({ field }) => (
                                <Combobox
                                    label="Categories"
                                    required
                                    multiple
                                    value={field.value || []}
                                    onChange={field.onChange}
                                    options={categories.map(c => ({ value: c.categoryName, label: c.categoryName }))}
                                    allowCreate={true}
                                    onCreateNew={async (categoryName) => {
                                        await addCategory({ categoryName, count: 0, description: '' });
                                    }}
                                />
                            )} />
                            <Controller name="taskName" control={control} render={({ field }) => (
                                <Combobox
                                    label="Tasks"
                                    required
                                    multiple
                                    value={field.value || []}
                                    onChange={field.onChange}
                                    options={tasks.map(t => ({ value: t.taskName, label: t.taskName }))}
                                    allowCreate={true}
                                    onCreateNew={async (taskName) => {
                                        await addTask({ taskName, count: 0, description: '' });
                                    }}
                                />
                            )} />
                        </div>
                        <Controller name="tags" control={control} render={({ field }) => (
                            <Combobox
                                label="Tags"
                                multiple
                                value={field.value || []}
                                onChange={field.onChange}
                                options={tags.map(t => ({ value: t.tagName, label: t.tagName }))}
                                placeholder="Search or add tags..."
                                allowCreate={true}
                                onCreateNew={async (tagName) => {
                                    await addTag({ tagName, count: 0 });
                                }}
                            />
                        )} />
                    </Section>

                    {/* 3. Pricing */}
                    <Section title="3. Pricing">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Pricing Model</label>
                                <Controller name="pricing" control={control} render={({ field }) => (
                                    <SearchableSelect
                                        value={field.value || 'free'}
                                        onChange={field.onChange}
                                        options={[
                                            { value: 'free', label: 'Free' },
                                            { value: 'freemium', label: 'Freemium' },
                                            { value: 'paid', label: 'Paid' },
                                        ]}
                                        showSearch={false}
                                    />
                                )} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Billing Frequency</label>
                                <Controller name="billingFrequency" control={control} render={({ field }) => (
                                    <SearchableSelect
                                        value={field.value || 'monthly'}
                                        onChange={field.onChange}
                                        options={[
                                            { value: 'monthly', label: 'Monthly' },
                                            { value: 'yearly', label: 'Yearly' },
                                            { value: 'one-time', label: 'One-time' },
                                            { value: 'custom', label: 'Custom' },
                                        ]}
                                        showSearch={false}
                                    />
                                )} />
                            </div>
                            <Input label="Pricing Label" {...register('pricingLabel')} placeholder="From $20/mo" />
                            <Input label="Discount" {...register('discount')} placeholder="20% off" />
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                            <Controller name="hasFreeTrial" control={control} render={({ field }) => <Toggle label="Free Trial" checked={field.value || false} onChange={field.onChange} />} />
                            {watch('hasFreeTrial') && (
                                <>
                                    <input type="number" {...register('freeTrialDays', { valueAsNumber: true })} className="w-20 px-2 py-1 bg-bg-secondary border border-border rounded text-sm" />
                                    <span className="text-sm text-text-secondary">days</span>
                                </>
                            )}
                        </div>
                        <Controller name="pricingTiers" control={control} render={({ field }) => <PricingTierEditor tiers={field.value || []} onChange={field.onChange} />} />
                    </Section>

                    {/* 4. Features & Content */}
                    <Section title="4. Features & Content">
                        <Controller name="coreFeatures" control={control} render={({ field }) => <ListEditor label="Core Features" items={field.value || []} onChange={field.onChange} />} />
                        <Controller name="useCases" control={control} render={({ field }) => <ListEditor label="Use Cases" items={field.value || []} onChange={field.onChange} />} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller name="pros" control={control} render={({ field }) => <ListEditor label="Pros" items={field.value || []} onChange={field.onChange} placeholder="Add a pro..." />} />
                            <Controller name="cons" control={control} render={({ field }) => <ListEditor label="Cons" items={field.value || []} onChange={field.onChange} placeholder="Add a con..." />} />
                        </div>
                        <Controller name="faq" control={control} render={({ field }) => <FAQEditor items={field.value || []} onChange={field.onChange} />} />
                    </Section>

                    {/* 5. Media Assets */}
                    <Section title="5. Media Assets">
                        <Controller name="images" control={control} render={({ field }) => (
                            <MediaUpload multiple label="Screenshots" items={field.value || []} onItemsChange={field.onChange} uploadType="image" accept="image/*" mediaType="image" showAltText={false} />
                        )} />
                        <Controller name="videos" control={control} render={({ field }) => (
                            <MediaUpload multiple label="Videos" items={field.value || []} onItemsChange={field.onChange} uploadType="video" accept="video/*" mediaType="video" showAltText={false} />
                        )} />
                    </Section>

                    {/* 6. Contact Details */}
                    <Section title="6. Contact Details (Confidential)" defaultOpen={false}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Contact Name" {...register('contactName')} />
                            <Input label="Contact Email" type="email" {...register('contactEmail')} />
                            <Input label="Company" {...register('contactCompany')} />
                            <Input label="Mobile" {...register('contactMobile')} />
                        </div>
                        <Input label="Address" {...register('contactAddress')} />
                    </Section>

                    {/* 7. Social Profiles */}
                    <Section title="7. Social Profiles" defaultOpen={false}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <Input label="Instagram" {...register('socialLinks.instagram')} placeholder="URL" />
                            <Input label="Facebook" {...register('socialLinks.facebook')} placeholder="URL" />
                            <Input label="Twitter/X" {...register('socialLinks.twitter')} placeholder="URL" />
                            <Input label="Discord" {...register('socialLinks.discord')} placeholder="Invite URL" />
                            <Input label="LinkedIn" {...register('socialLinks.linkedin')} placeholder="URL" />
                            <Input label="YouTube" {...register('socialLinks.youtube')} placeholder="URL" />
                            <Input label="TikTok" {...register('socialLinks.tiktok')} placeholder="URL" />
                            <Input label="Other" {...register('socialLinks.other')} placeholder="URL" />
                        </div>
                    </Section>

                    {/* 8. App Store Links */}
                    <Section title="8. App Store Links" defaultOpen={false}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Play Store URL" {...register('playStoreUrl')} placeholder="https://play.google.com/store/apps/details?id=..." />
                            <Input label="App Store URL" {...register('appStoreUrl')} placeholder="https://apps.apple.com/app/..." />
                        </div>
                    </Section>

                    {/* 9. Internal Notes */}
                    <Section title="9. Internal Notes" defaultOpen={false}>
                        <Controller name="internalNotes" control={control} render={({ field }) => <NotesEditor notes={field.value || []} onChange={field.onChange} />} />
                    </Section>

                    {/* 10. Version History */}
                    <Section title="10. Version History" defaultOpen={false}>
                        <Controller name="versionHistory" control={control} render={({ field }) => <VersionEditor versions={field.value || []} onChange={field.onChange} />} />
                    </Section>

                    {/* 11. Alternative Tools & References */}
                    <Section title="11. Alternative Tools & References" defaultOpen={false}>
                        <Controller name="alternativeTools" control={control} render={({ field }) => (
                            <Combobox
                                label="Alternative Tools"
                                multiple
                                value={field.value || []}
                                onChange={field.onChange}
                                options={tools.map(t => ({ value: t.slug, label: t.name, image: t.logoUrl }))}
                                allowCreate={false}
                                placeholder="Search existing tools..."
                            />
                        )} />
                        <Controller name="references" control={control} render={({ field }) => <ListEditor label="References" items={field.value || []} onChange={field.onChange} placeholder="Add reference URL..." />} />
                    </Section>

                    {/* 12. Publishing & Status */}
                    <Section title="12. Publishing & Status">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
                                <Controller name="status" control={control} render={({ field }) => (
                                    <SearchableSelect
                                        value={field.value || 'draft'}
                                        onChange={field.onChange}
                                        options={[
                                            { value: 'draft', label: 'Draft' },
                                            { value: 'pending', label: 'Pending Review' },
                                            { value: 'published', label: 'Published' },
                                            { value: 'unpublished', label: 'Unpublished' },
                                            { value: 'scheduled', label: 'Scheduled' },
                                        ]}
                                        placeholder="Select status..."
                                        showSearch={false}
                                    />
                                )} />
                            </div>
                            {watch('status') === 'scheduled' && <Input label="Scheduled Date" type="datetime-local" {...register('scheduledAt')} />}
                        </div>
                        <div className="pt-4 border-t border-border mt-4">
                            <Controller name="spotlightEnabled" control={control} render={({ field }) => <Toggle label="Enable Spotlight" checked={field.value || false} onChange={field.onChange} />} />
                            {watch('spotlightEnabled') && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <Input label="Position" type="number" {...register('spotlightPosition', { valueAsNumber: true })} />
                                    <Input label="Start Date" type="date" {...register('spotlightStartDate')} />
                                    <Input label="End Date" type="date" {...register('spotlightEndDate')} />
                                </div>
                            )}
                        </div>
                        <div className="pt-4 border-t border-border mt-4">
                            <Controller name="premium" control={control} render={({ field }) => <Toggle label="Premium" checked={field.value || false} onChange={field.onChange} />} />
                            <p className="text-xs text-text-tertiary mt-1">Premium tools get SEO backlinks (dofollow) and direct website links</p>
                        </div>
                        <div className="pt-4 border-t border-border mt-4">
                            <Input label="Save Count" type="number" {...register('saveCount', { valueAsNumber: true })} placeholder="0" />
                            <p className="text-xs text-text-tertiary mt-1">Number of saves/bookmarks for this tool</p>
                        </div>
                    </Section>
                </div>

                {/* Preview */}
                <div className="lg:col-span-1">
                    <LivePreview control={control} categories={categories} onExpand={() => setShowFullPreview(true)} />
                </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-border">
                <button type="button" onClick={() => router.back()} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary">Cancel</button>
                <button type="button" onClick={handleSaveAsDraft} disabled={isSubmitting} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save as Draft'}</button>
                {!isEdit && <button type="button" onClick={handleReadyForReview} disabled={isSubmitting} className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Ready for Review'}</button>}
                {isEdit && <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Update'}</button>}
            </div>

            {/* Full Preview Modal */}
            {showFullPreview && (
                <FullPreview
                    data={{
                        name: watch('name'),
                        summary: watch('summary'),
                        description: watch('description'),
                        logoUrl: watch('logoUrl'),
                        status: watch('status'),
                        pricing: watch('pricing'),
                        pricingLabel: watch('pricingLabel'),
                        categoryName: watch('categoryName'),
                        taskName: watch('taskName'),
                        websiteUrl: watch('websiteUrl'),
                        affiliateUrl: watch('affiliateUrl'),
                        affiliateEnabled: watch('affiliateEnabled'),
                        tags: watch('tags'),
                        pros: watch('pros'),
                        cons: watch('cons'),
                        coreFeatures: watch('coreFeatures'),
                        useCases: watch('useCases'),
                        faq: watch('faq'),
                        images: watch('images'),
                        videos: watch('videos'),
                        pricingTiers: watch('pricingTiers'),
                        socialLinks: watch('socialLinks'),
                    }}
                    categories={categories}
                    tasks={tasks}
                    onClose={() => setShowFullPreview(false)}
                />
            )}
        </form>
    );
}
