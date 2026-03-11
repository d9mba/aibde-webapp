'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdmin, AdminTool, Category, Task, Tag } from '@/context/AdminContext';

import { useTaxonomySearch } from '@/hooks/useTaxonomySearch';
import { Input, Toggle, Section, ListEditor, Combobox, RichTextEditor, MediaUpload, useToast, SearchableSelect } from '@/components/ui';
import { toolSchema, ToolFormData, defaultToolValues } from './ToolForm/schema';
import FullPreview from './ToolForm/FullPreview';
import { getPricingClass, getPricingLabel } from '@/lib/formatters';
import { getFullUrl } from '@/lib/url';

interface ToolFormProps { toolId?: string; }

// Slugify helper
const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Example JSON template for the Copy Example button (module-level to avoid hooks issues)
const EXAMPLE_JSON = JSON.stringify({
    name: 'ChatGPT',
    appUsername: 'chatgpt',
    summary: 'AI-powered chatbot by OpenAI for conversations, writing, and coding',
    description: '<p>ChatGPT is an advanced AI assistant built on GPT-4...</p>',
    isAiGenerated: false,
    logoUrl: 'https://example.com/logo.png',
    websiteUrl: 'https://chat.openai.com',
    affiliateUrl: '',
    affiliateEnabled: false,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.openai.chatgpt',
    appStoreUrl: 'https://apps.apple.com/app/chatgpt/id6448311069',
    categoryName: ['AI Chatbot', 'AI Writing'],
    taskName: ['Content Creation', 'Code Generation'],
    tags: ['ai', 'chatbot', 'gpt', 'writing'],
    pricing: 'freemium',
    pricingLabel: 'From $20/mo',
    billingFrequency: 'monthly',
    discount: '',
    hasFreeTrial: false,
    freeTrialDays: 0,
    pricingTiers: [
        {
            name: 'Free',
            price: '$0',
            billingFrequency: 'monthly',
            features: ['GPT-3.5 access', 'Limited messages'],
            highlighted: false
        },
        {
            name: 'Plus',
            price: '$20',
            billingFrequency: 'monthly',
            features: ['GPT-4 access', 'Unlimited messages', 'Priority support'],
            highlighted: true
        }
    ],
    coreFeatures: ['Natural language understanding', 'Code generation', 'Creative writing'],
    useCases: ['Writing assistance', 'Programming help', 'Research'],
    pros: ['Easy to use', 'Versatile', 'Constantly improving'],
    cons: ['Can hallucinate', 'Paid tier required for GPT-4'],
    faq: [
        {
            question: 'Is ChatGPT free?',
            answer: 'Yes, a free tier is available with GPT-3.5. GPT-4 requires ChatGPT Plus at $20/mo.'
        }
    ],
    images: ['https://example.com/screenshot1.png'],
    videos: ['https://youtube.com/watch?v=example'],
    contactName: 'OpenAI',
    contactEmail: 'support@openai.com',
    contactCompany: 'OpenAI',
    contactAddress: '',
    contactMobile: '',
    socialLinks: {
        twitter: 'https://twitter.com/openai',
        linkedin: 'https://linkedin.com/company/openai',
        discord: '',
        youtube: 'https://youtube.com/@openai'
    },
    versionHistory: [
        {
            version: '4.0',
            releaseNotes: 'GPT-4 model launch',
            launchedOn: '2024-03-14'
        }
    ],
}, null, 2);

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
const VersionEditor = ({ versions, onChange }: { versions: { version: string; releaseNotes: string; launchedOn: string }[]; onChange: (versions: { version: string; releaseNotes: string; launchedOn: string }[]) => void }) => {
    const [v, setV] = useState({ version: '', releaseNotes: '', launchedOn: '' });
    const add = () => { if (v.version.trim()) { onChange([...versions, { ...v, launchedOn: v.launchedOn || new Date().toISOString().split('T')[0] }]); setV({ version: '', releaseNotes: '', launchedOn: '' }); } };
    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Version History</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
                <input value={v.version} onChange={e => setV({ ...v, version: e.target.value })} placeholder="Version (e.g., 2.0)" className="px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm" />
                <input type="date" value={v.launchedOn} onChange={e => setV({ ...v, launchedOn: e.target.value })} className="px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm" />
                <button type="button" onClick={add} className="px-3 py-2 bg-accent-primary text-white rounded-lg text-sm">Add</button>
            </div>
            <textarea value={v.releaseNotes} onChange={e => setV({ ...v, releaseNotes: e.target.value })} placeholder="Release notes..." rows={2} className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm resize-none mb-3" />
            {versions.map((ver, i) => (
                <div key={i} className="p-3 bg-bg-secondary rounded-lg mb-2 flex justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-primary">v{ver.version} - {ver.launchedOn}</p>
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
                    {values.logoUrl ? <img src={getFullUrl(values.logoUrl)} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-2xl text-text-tertiary">🔧</span>}
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
    const { addTool, updateTool, addTag, addCategory, addTask, isLoaded } = useAdmin();

    // Search-as-you-type taxonomy hooks
    const catSearch = useTaxonomySearch('/api/categories', 'categoryName');
    const taskSearch = useTaxonomySearch('/api/tasks', 'taskName');
    const tagSearch = useTaxonomySearch('/api/tags', 'tagName');
    const { showToast, updateToast } = useToast();
    const isEdit = !!toolId;

    // Fetch existing tool from API instead of context
    const [existingTool, setExistingTool] = useState<AdminTool | null>(null);
    const showToastRef = useRef(showToast);
    useEffect(() => { showToastRef.current = showToast; }, [showToast]);
    useEffect(() => {
        if (!isEdit) return;
        const controller = new AbortController();
        fetch(`/api/tools/${toolId}`, { signal: controller.signal })
            .then(r => {
                if (!r.ok) throw new Error(`Failed to load tool (${r.status})`);
                return r.json();
            })
            .then(data => setExistingTool(data))
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    showToastRef.current(err.message || 'Failed to load tool details', 'error');
                }
            });
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toolId, isEdit]);

    const [showFullPreview, setShowFullPreview] = useState(false);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [showJsonImport, setShowJsonImport] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState('');
    const [parsedJsonData, setParsedJsonData] = useState<Record<string, any> | null>(null);
    const [slugLocked, setSlugLocked] = useState(isEdit); // locked by default in edit mode
    const isRepostUpdate = useRef(false);

    // Search-as-you-type for alternative tools combobox
    const [alternativeOptions, setAlternativeOptions] = useState<{ value: string; label: string; image?: string }[]>([]);
    const [altLoading, setAltLoading] = useState(false);
    const altSearchRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const altAbortRef = useRef<AbortController | null>(null);
    const handleAltSearch = useCallback((query: string) => {
        clearTimeout(altSearchRef.current);
        altAbortRef.current?.abort();
        if (!query || query.length < 3) { setAlternativeOptions([]); setAltLoading(false); return; }
        setAltLoading(true);
        altSearchRef.current = setTimeout(() => {
            const controller = new AbortController();
            altAbortRef.current = controller;
            fetch(`/api/tools?search=${encodeURIComponent(query)}&limit=20&status=published`, { signal: controller.signal })
                .then(r => r.ok ? r.json() : { data: [] })
                .then(json => setAlternativeOptions(
                    (json.data || []).map((t: AdminTool) => ({ value: t.appUsername, label: t.name, image: t.logoUrl }))
                ))
                .catch((err) => {
                    if (err.name !== 'AbortError') console.error('[ToolForm] Alt search failed:', err);
                })
                .finally(() => {
                    if (!controller.signal.aborted) setAltLoading(false);
                });
        }, 300);
    }, []);

    // Cleanup debounce timeout and abort on unmount
    useEffect(() => {
        return () => {
            clearTimeout(altSearchRef.current);
            altAbortRef.current?.abort();
        };
    }, []);

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

        // AdminTool uses camelCase `appUsername` but the form schema uses snake_case `app_username`
        // Remap explicitly so the field is populated when editing an existing tool
        if (tool.appUsername) {
            sanitized.app_username = tool.appUsername;
        }

        for (const key in tool) {
            if (key === 'appUsername') continue; // already mapped above
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
        let timer: ReturnType<typeof setTimeout> | undefined;
        let controller: AbortController | undefined;

        if (!isEdit && watchName) {
            setValue('app_username', slugify(watchName || ''));
            controller = new AbortController();
            timer = setTimeout(() => {
                fetch(`/api/tools?search=${encodeURIComponent(watchName)}&limit=1&status=published`, { signal: controller!.signal })
                    .then(r => r.ok ? r.json() : { data: [] })
                    .then(json => {
                        const match = (json.data || []).find((t: AdminTool) => (t.name || '').toLowerCase() === watchName.toLowerCase());
                        setShowDuplicateWarning(!!match);
                    })
                    .catch((err) => {
                        if (err.name !== 'AbortError') console.error('[ToolForm] Duplicate check failed:', err);
                    });
            }, 300);
        } else if (!isEdit) {
            setValue('app_username', slugify(watchName || ''));
        }

        return () => {
            if (timer) clearTimeout(timer);
            controller?.abort();
        };
    }, [watchName, isEdit, setValue]);

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
            // Compute success message first, before resetting flags
            const wasRepost = isRepostUpdate.current;
            if (isEdit && toolId) {
                const updateData = wasRepost
                    ? { ...data, isReposted: true }
                    : data;
                await updateTool(toolId, updateData);
            }
            else await addTool(data as any);
            // Clear pending uploads on success - they're now saved
            sessionStorage.removeItem(UPLOAD_KEY);

            // Show appropriate success message
            let successMsg = wasRepost ? 'Tool updated & posted to Just Released!' : 'Tool updated successfully!';
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
        } finally {
            isRepostUpdate.current = false;
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

    const handleUpdateAndPost = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isRepostUpdate.current = true;
        await handleSubmit(onSubmit, onFormError)();
    };

    // Common form error handler - shows which fields are missing/invalid
    const onFormError = (errors: any) => {
        isRepostUpdate.current = false;
        console.error('Form validation errors:', errors);

        // Get all field names with errors
        const errorFields = Object.keys(errors);
        const errorMessages = Object.entries(errors).map(([field, error]: [string, any]) => {
            return `${field}: ${error?.message || 'Invalid'}`;
        });

        // Show detailed error message
        if (errorFields.length > 0) {
            const fieldList = errorFields.join(', ');
            showToast(`Missing/invalid fields: ${fieldList}`, 'error');
            console.log('Detailed errors:', errorMessages);
        } else {
            showToast('Please fill in required fields', 'error');
        }
    };



    // Field mappings for JSON import (common aliases → our schema names)
    const fieldMappings: Record<string, string> = {
        'tool_name': 'name', 'toolName': 'name', 'title': 'name',
        'short_description': 'summary', 'shortDescription': 'summary',
        'long_description': 'description', 'longDescription': 'description',
        'website': 'websiteUrl', 'website_url': 'websiteUrl', 'url': 'websiteUrl',
        'logo': 'logoUrl', 'logo_url': 'logoUrl',
        'category': 'categoryName', 'categories': 'categoryName',
        'task': 'taskName', 'tasks': 'taskName',
        'price': 'pricing', 'pricing_model': 'pricing',
        'features': 'coreFeatures', 'core_features': 'coreFeatures',
        'use_cases': 'useCases', 'launched_on': 'launchedOn',
        'free_trial': 'hasFreeTrial', 'freeTrial': 'hasFreeTrial',
        'trial_days': 'freeTrialDays',
        'affiliate_url': 'affiliateUrl',
        'social': 'socialLinks', 'social_links': 'socialLinks',
        'username': 'app_username', 'appUsername': 'app_username',
        'ai_generated': 'isAiGenerated', 'aiGenerated': 'isAiGenerated',
        'listing_type': 'listingType', 'listing': 'listingType',
        'play_store': 'playStoreUrl', 'playStore': 'playStoreUrl',
        'app_store': 'appStoreUrl', 'appStore': 'appStoreUrl',
        'internal_notes': 'internalNotes', 'notes': 'internalNotes',
        'version_history': 'versionHistory', 'versions': 'versionHistory',
        'alternative_tools': 'alternativeTools', 'alternatives': 'alternativeTools',
    };

    const stringArrayFields = ['categoryName', 'taskName', 'tags', 'coreFeatures', 'useCases', 'pros', 'cons', 'images', 'videos', 'alternativeTools', 'references'];

    // Ensure a value is an array of strings
    const ensureArray = (value: unknown): string[] => {
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === 'string') return value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
        if (typeof value === 'object') return [];
        if (value != null) return [String(value)];
        return [];
    };

    // Step 1: Parse JSON → store normalised data for dynamic editing
    const handleJsonParse = () => {
        setJsonError('');
        if (!jsonInput.trim()) { setJsonError('Please paste JSON data'); return; }

        try {
            const raw = JSON.parse(jsonInput);
            const normalised: Record<string, any> = {};

            for (const [key, value] of Object.entries(raw)) {
                if (value === null || value === undefined) continue;
                const fieldName = fieldMappings[key] || key;
                if (!(fieldName in defaultToolValues)) continue;

                if (stringArrayFields.includes(fieldName)) {
                    normalised[fieldName] = ensureArray(value);
                } else if (typeof (defaultToolValues as any)[fieldName] === 'boolean') {
                    normalised[fieldName] = Boolean(value);
                } else if (typeof (defaultToolValues as any)[fieldName] === 'number') {
                    normalised[fieldName] = Number(value) || 0;
                } else if (fieldName === 'socialLinks' && typeof value === 'object' && !Array.isArray(value)) {
                    normalised[fieldName] = value;
                } else if (Array.isArray(value)) {
                    normalised[fieldName] = value;
                } else {
                    normalised[fieldName] = String(value);
                }
            }

            if (Object.keys(normalised).length === 0) {
                setJsonError('No matching fields found in JSON');
                return;
            }
            setParsedJsonData(normalised);
        } catch (e) {
            setJsonError(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    };

    // Update a field in the parsed preview
    const updateParsedField = (field: string, value: any) => {
        setParsedJsonData(prev => prev ? { ...prev, [field]: value } : prev);
    };

    // Step 2: Apply previewed data to the actual form
    const handleApplyImport = () => {
        if (!parsedJsonData) return;
        let count = 0;
        for (const [fieldName, value] of Object.entries(parsedJsonData)) {
            setValue(fieldName as any, value, { shouldDirty: true });
            count++;
        }
        showToast(`Imported ${count} fields successfully!`, 'success');
        setParsedJsonData(null);
        setJsonInput('');
        setShowJsonImport(false);
    };

    const copyExampleJson = async () => {
        try {
            await navigator.clipboard.writeText(EXAMPLE_JSON);
            showToast('Example JSON copied to clipboard!', 'success');
        } catch {
            showToast('Failed to copy to clipboard', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit, onFormError)} className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-text-primary">{isEdit ? 'Edit Tool' : 'Add New Tool'}</h1>
                <div className="flex gap-2">
                    {!isEdit && (
                        <button
                            type="button"
                            onClick={() => setShowJsonImport(!showJsonImport)}
                            className="px-3 py-1.5 text-sm border border-accent-primary text-accent-primary rounded-lg hover:bg-accent-primary/10"
                        >
                            {showJsonImport ? 'Hide JSON Import' : '📋 Import JSON'}
                        </button>
                    )}
                    <button type="button" onClick={() => router.back()} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary">Cancel</button>
                    <button type="button" onClick={handleSaveAsDraft} disabled={isSubmitting} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save as Draft'}</button>
                    {!isEdit && <button type="button" onClick={handleReadyForReview} disabled={isSubmitting} className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Ready for Review'}</button>}
                    {isEdit && <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Update'}</button>}
                    {isEdit && <button type="button" onClick={handleUpdateAndPost} disabled={isSubmitting} className="px-4 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Posting...' : 'Update & Post'}</button>}
                </div>
            </div>

            {/* JSON Import Section */}
            {showJsonImport && (
                <div className="mb-6 p-4 bg-bg-card border border-accent-primary/30 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-text-primary">📋 Quick Import from JSON</h3>
                        <button type="button" onClick={() => { setShowJsonImport(false); setParsedJsonData(null); }} className="text-text-tertiary hover:text-text-primary">×</button>
                    </div>

                    {!parsedJsonData ? (
                        /* Step 1: Paste JSON */
                        <>
                            {/* Copy Example + Schema Reference */}
                            <div className="flex items-center gap-2 mb-4">
                                <button type="button" onClick={copyExampleJson} className="px-3 py-1.5 text-xs font-medium border border-accent-primary/40 text-accent-primary rounded-lg hover:bg-accent-primary/10 transition-colors flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                                    Copy Example JSON
                                </button>
                                <details className="flex-1 bg-bg-secondary rounded-lg border border-border">
                                    <summary className="px-3 py-1.5 text-xs font-medium text-text-secondary cursor-pointer hover:text-text-primary">
                                        📖 View Full Schema
                                    </summary>
                                    <div className="px-3 py-2 text-xs text-text-tertiary font-mono border-t border-border max-h-64 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap">{`{
  // BASIC SETTINGS (Required: name, summary, description)
  "name": "string",           // Tool name *required
  "app_username": "string",   // URL slug/handle
  "summary": "string",        // Short description *required
  "description": "string",    // Full description (HTML) *required
  "isAiGenerated": false,     // AI-generated content flag
  "logoUrl": "string",        // Logo image URL
  "websiteUrl": "string",     // Official website
  "affiliateUrl": "string",   // Affiliate link
  "affiliateEnabled": false,  // Enable affiliate redirect

  // APP STORE LINKS
  "playStoreUrl": "string",
  "appStoreUrl": "string",

  // CATEGORIES & CLASSIFICATION
  "categoryName": ["string"], // Categories array
  "taskName": ["string"],     // Tasks array  
  "tags": ["string"],         // Tags array

  // PRICING
  "pricing": "free|freemium|paid|open_source",
  "pricingLabel": "string",   // e.g., "From $20/mo"
  "billingFrequency": "monthly|yearly|one-time|custom",
  "discount": "string",       // e.g., "20% off"
  "hasFreeTrial": false,
  "freeTrialDays": 14,
  "pricingTiers": [{          // Pricing tiers
    "name": "string",
    "price": "string",
    "billingFrequency": "string",
    "features": ["string"],
    "highlighted": false
  }],

  // FEATURES & CONTENT
  "coreFeatures": ["string"], // Key features list
  "useCases": ["string"],     // Use cases list
  "pros": ["string"],         // Pros list
  "cons": ["string"],         // Cons list
  "faq": [{                   // FAQ items
    "question": "string",
    "answer": "string"
  }],

  // MEDIA
  "images": ["string"],       // Screenshot URLs
  "videos": ["string"],       // Video URLs

  // CONTACT (Confidential)
  "contactName": "string",
  "contactEmail": "string",
  "contactCompany": "string",
  "contactAddress": "string",
  "contactMobile": "string",

  // SOCIAL LINKS
  "socialLinks": {
    "instagram": "string",
    "facebook": "string",
    "twitter": "string",
    "linkedin": "string",
    "discord": "string",
    "youtube": "string",
    "tiktok": "string",
    "other": "string"
  },

  // VERSION HISTORY
  "versionHistory": [{        // Release versions
    "version": "string",
    "releaseNotes": "string",
    "launchedOn": "YYYY-MM-DD"
  }]
}`}</pre>
                                    </div>
                                </details>
                            </div>

                            {/* JSON Editor with Line Numbers */}
                            <div className="relative flex border border-border rounded-lg overflow-hidden bg-bg-secondary">
                                <div className="flex-shrink-0 bg-bg-tertiary border-r border-border px-2 py-2 text-right select-none">
                                    {(jsonInput || ' ').split('\n').map((_, i) => (
                                        <div key={i} className="text-xs text-text-tertiary font-mono leading-5">{i + 1}</div>
                                    ))}
                                </div>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => { setJsonInput(e.target.value); setJsonError(''); }}
                                    placeholder='Paste your JSON here...'
                                    rows={10}
                                    className="flex-1 px-3 py-2 bg-transparent text-sm text-text-primary font-mono resize-none focus:outline-none leading-5"
                                    spellCheck={false}
                                />
                            </div>
                            {jsonError && (
                                <div className="mt-2 p-2 bg-accent-red/10 border border-accent-red/30 rounded-lg">
                                    <p className="text-xs text-accent-red font-mono">{jsonError}</p>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-3">
                                <button type="button" onClick={() => { setJsonInput(''); setJsonError(''); }} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary">Clear</button>
                                <button type="button" onClick={handleJsonParse} className="px-4 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90">Parse & Preview →</button>
                            </div>
                        </>
                    ) : (
                        /* Step 2: Dynamic Edit Preview */
                        <>
                            <p className="text-xs text-text-tertiary mb-4">Review and edit the imported fields before applying them to the form. {Object.keys(parsedJsonData).length} fields detected.</p>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                                {/* Basic Settings */}
                                {(parsedJsonData.name != null || parsedJsonData.summary != null || parsedJsonData.description != null || parsedJsonData.websiteUrl != null || parsedJsonData.logoUrl != null || parsedJsonData.launchedOn != null) && (
                                    <Section title="1. Basic Settings">
                                        <div className="space-y-4">
                                            {parsedJsonData.name != null && <Input label="Name" required value={parsedJsonData.name} onChange={(e) => updateParsedField('name', e.target.value)} />}
                                            {parsedJsonData.summary != null && <Input label="Summary" value={parsedJsonData.summary} onChange={(e) => updateParsedField('summary', e.target.value)} maxLength={200} />}
                                            {parsedJsonData.logoUrl != null && <MediaUpload label="Logo" uploadType="logo" toolName={parsedJsonData.name || 'tool'} value={parsedJsonData.logoUrl} onChange={(url) => updateParsedField('logoUrl', url)} />}
                                            {parsedJsonData.description != null && (
                                                <div>
                                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
                                                    <RichTextEditor value={parsedJsonData.description} onChange={(val) => updateParsedField('description', val)} placeholder="Description..." />
                                                </div>
                                            )}
                                            {parsedJsonData.websiteUrl != null && <Input label="Website" type="url" value={parsedJsonData.websiteUrl} onChange={(e) => updateParsedField('websiteUrl', e.target.value)} />}
                                            {parsedJsonData.launchedOn != null && <Input label="Launched On" type="date" value={parsedJsonData.launchedOn} onChange={(e) => updateParsedField('launchedOn', e.target.value)} />}
                                        </div>
                                    </Section>
                                )}

                                {/* Categories & Classification */}
                                {(parsedJsonData.categoryName != null || parsedJsonData.taskName != null || parsedJsonData.tags != null) && (
                                    <Section title="2. Categories & Classification">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {parsedJsonData.categoryName != null && (
                                                <Combobox label="Categories" required multiple value={ensureArray(parsedJsonData.categoryName)} onChange={(val) => updateParsedField('categoryName', val)} options={catSearch.options} loading={catSearch.loading} onSearchChange={catSearch.onSearchChange} allowCreate onCreateNew={async (n) => { await addCategory({ categoryName: n, count: 0, description: '' }); }} />
                                            )}
                                            {parsedJsonData.taskName != null && (
                                                <Combobox label="Tasks" required multiple value={ensureArray(parsedJsonData.taskName)} onChange={(val) => updateParsedField('taskName', val)} options={taskSearch.options} loading={taskSearch.loading} onSearchChange={taskSearch.onSearchChange} allowCreate onCreateNew={async (n) => { await addTask({ taskName: n, count: 0, description: '' }); }} />
                                            )}
                                        </div>
                                        {parsedJsonData.tags != null && (
                                            <div className="mt-4">
                                                <Combobox label="Tags" multiple value={ensureArray(parsedJsonData.tags)} onChange={(val) => updateParsedField('tags', val)} options={tagSearch.options} loading={tagSearch.loading} onSearchChange={tagSearch.onSearchChange} allowCreate onCreateNew={async (n) => { await addTag({ tagName: n, count: 0 }); }} />
                                            </div>
                                        )}
                                    </Section>
                                )}

                                {/* Pricing */}
                                {(parsedJsonData.pricing != null || parsedJsonData.pricingLabel != null) && (
                                    <Section title="3. Pricing">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {parsedJsonData.pricing != null && (
                                                <div>
                                                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Pricing Model</label>
                                                    <SearchableSelect value={parsedJsonData.pricing} onChange={(val) => updateParsedField('pricing', val)} options={[{ value: 'free', label: 'Free' }, { value: 'freemium', label: 'Freemium' }, { value: 'paid', label: 'Paid' }, { value: 'open_source', label: 'Open Source' }]} showSearch={false} />
                                                </div>
                                            )}
                                            {parsedJsonData.pricingLabel != null && <Input label="Pricing Label" value={parsedJsonData.pricingLabel} onChange={(e) => updateParsedField('pricingLabel', e.target.value)} placeholder="From $20/mo" />}
                                        </div>
                                    </Section>
                                )}

                                {/* Features & Content */}
                                {(parsedJsonData.coreFeatures != null || parsedJsonData.useCases != null || parsedJsonData.pros != null || parsedJsonData.cons != null) && (
                                    <Section title="4. Features & Content">
                                        <div className="space-y-4">
                                            {parsedJsonData.coreFeatures != null && <ListEditor label="Core Features" items={ensureArray(parsedJsonData.coreFeatures)} onChange={(val) => updateParsedField('coreFeatures', val)} />}
                                            {parsedJsonData.useCases != null && <ListEditor label="Use Cases" items={ensureArray(parsedJsonData.useCases)} onChange={(val) => updateParsedField('useCases', val)} />}
                                            <div className="grid grid-cols-2 gap-4">
                                                {parsedJsonData.pros != null && <ListEditor label="Pros" items={ensureArray(parsedJsonData.pros)} onChange={(val) => updateParsedField('pros', val)} />}
                                                {parsedJsonData.cons != null && <ListEditor label="Cons" items={ensureArray(parsedJsonData.cons)} onChange={(val) => updateParsedField('cons', val)} />}
                                            </div>
                                        </div>
                                    </Section>
                                )}

                                {/* Media */}
                                {(parsedJsonData.images != null || parsedJsonData.videos != null) && (
                                    <Section title="5. Media">
                                        {parsedJsonData.images != null && <MediaUpload multiple label="Screenshots" uploadType="image" toolName={parsedJsonData.name || 'tool'} items={ensureArray(parsedJsonData.images)} onItemsChange={(items) => updateParsedField('images', items)} showAltText={false} />}
                                        {parsedJsonData.videos != null && <MediaUpload multiple label="Videos" uploadType="video" mediaType="video" accept="video/*" toolName={parsedJsonData.name || 'tool'} items={ensureArray(parsedJsonData.videos)} onItemsChange={(items) => updateParsedField('videos', items)} showAltText={false} />}
                                    </Section>
                                )}

                                {/* FAQ */}
                                {parsedJsonData.faq != null && Array.isArray(parsedJsonData.faq) && (
                                    <Section title="6. FAQ" defaultOpen={false}>
                                        <FAQEditor items={parsedJsonData.faq} onChange={(items) => updateParsedField('faq', items)} />
                                    </Section>
                                )}
                            </div>

                            <div className="flex justify-between gap-2 mt-4 pt-3 border-t border-border">
                                <button type="button" onClick={() => setParsedJsonData(null)} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary">← Back to JSON</button>
                                <button type="button" onClick={handleApplyImport} className="px-4 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90">Apply {Object.keys(parsedJsonData).length} Fields to Form</button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {showDuplicateWarning && <div className="mb-4 p-3 bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg text-sm text-accent-yellow">⚠️ A tool with this name already exists</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">

                    {/* 1. Basic Settings */}
                    <Section title="1. Basic Settings">
                        <Input label="Name of Tool" required {...register('name')} error={errors.name?.message} />
                        {/* App Username - locked by default in edit mode, unlock by clicking the edit button */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                App Username
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    {...register('app_username')}
                                    readOnly={isEdit && slugLocked}
                                    placeholder="unique-username"
                                    className={`flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-colors ${
                                        isEdit && slugLocked ? 'opacity-60 cursor-not-allowed select-none' : ''
                                    }`}
                                />
                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={() => setSlugLocked(l => !l)}
                                        title={slugLocked ? 'Unlock to edit slug' : 'Lock slug'}
                                        className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all flex-shrink-0 ${
                                            slugLocked
                                                ? 'border-border text-text-tertiary hover:border-accent-primary hover:text-accent-primary'
                                                : 'border-accent-primary text-accent-primary bg-accent-primary/10'
                                        }`}
                                    >
                                        {slugLocked ? (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                            {isEdit && slugLocked && (
                                <p className="mt-1 text-xs text-text-tertiary">Click 🔒 to edit the URL slug (changes break existing links)</p>
                            )}
                        </div>
                        <Input label="Summary" required {...register('summary')} maxLength={200} error={errors.summary?.message} />
                        <Controller name="logoUrl" control={control} render={({ field }) => <MediaUpload label="App Logo" value={field.value || ''} onChange={field.onChange} uploadType="logo" toolName={watch('name')} />} />
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm font-medium text-text-secondary">Description <span className="text-accent-red">*</span></label>
                                <Controller name="isAiGenerated" control={control} render={({ field }) => (
                                    <label className="flex items-center gap-1.5 text-xs text-text-tertiary cursor-pointer hover:text-text-secondary">
                                        <input type="checkbox" checked={field.value || false} onChange={field.onChange} className="rounded w-3.5 h-3.5" />
                                        <svg className="w-3 h-3" viewBox="0 0 32 32" fill="currentColor">
                                            <path d="M22.714 9.238l-1.214-3.238-1.214 3.238-2.286 0.762 2.286 0.762 1.214 3.238 1.214-3.238 2.286-0.762-2.286-0.762zM20.714 21.238l-1.214-3.238-1.214 3.238-2.286 0.762 2.286 0.762 1.214 3.238 1.214-3.238 2.286-0.762-2.286-0.762zM13.459 13.486l-1.959-5.487-1.959 5.487-4.541 1.514 4.541 1.514 1.959 5.486 1.959-5.486 4.541-1.514-4.541-1.514z" />
                                        </svg>
                                        AI Generated
                                    </label>
                                )} />
                            </div>
                            <Controller name="description" control={control} render={({ field }) => <RichTextEditor value={field.value || ''} onChange={field.onChange} placeholder="Detailed description..." />} />
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
                        <Input label="Launched On" type="date" {...register('launchedOn')} />
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
                                    options={catSearch.options}
                                    loading={catSearch.loading}
                                    onSearchChange={catSearch.onSearchChange}
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
                                    options={taskSearch.options}
                                    loading={taskSearch.loading}
                                    onSearchChange={taskSearch.onSearchChange}
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
                                options={tagSearch.options}
                                loading={tagSearch.loading}
                                onSearchChange={tagSearch.onSearchChange}
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
                                            { value: 'open_source', label: 'Open Source' },
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
                                options={alternativeOptions}
                                allowCreate={false}
                                loading={altLoading}
                                emptyMessage="Type at least 3 characters to search"
                                helperText="Type to search existing tools."
                                onSearchChange={handleAltSearch}
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
                            <div className="max-w-sm">
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Listing Type</label>
                                <Controller name="listingType" control={control} render={({ field }) => (
                                    <SearchableSelect
                                        value={field.value || 'free'}
                                        onChange={field.onChange}
                                        options={[
                                            { value: 'free', label: 'Free Listing', icon: <span className="w-4 h-4 rounded-full bg-gray-400" /> },
                                            { value: 'fast', label: 'Fast Listing', icon: <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> },
                                            { value: 'verified', label: 'Verified', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#1d9bf0"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" /></svg> },
                                            { value: 'featured', label: 'Featured', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" /></svg> },
                                            { value: 'spotlight', label: 'Spotlight', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" /></svg> },
                                        ]}
                                        showSearch={false}
                                    />
                                )} />
                                <p className="text-xs text-text-tertiary mt-1">Determines listing badge: Blue for Verified, Gold for Featured</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-border mt-4">
                            <Controller name="backLinks" control={control} render={({ field }) => <Toggle label="Back Links" checked={field.value || false} onChange={field.onChange} />} />
                            <p className="text-xs text-text-tertiary mt-1">Enable dofollow SEO backlinks and direct website links (no UTM params)</p>
                        </div>
                        <div className="pt-4 border-t border-border mt-4">
                            <Input label="Save Count" type="number" {...register('saveCount', { valueAsNumber: true })} placeholder="0" />
                            <p className="text-xs text-text-tertiary mt-1">Number of saves/bookmarks for this tool</p>
                        </div>
                        <div className="pt-4 border-t border-border mt-4">
                            <Input label="Rating" type="number" step="0.1" min="0" max="5" {...register('rating', { valueAsNumber: true })} placeholder="0.0 - 5.0" />
                            <p className="text-xs text-text-tertiary mt-1">Tool rating (0-5 scale, e.g., 4.5). Leave empty to use calculated rating from votes.</p>
                        </div>
                    </Section>
                </div>

                {/* Preview */}
                <div className="lg:col-span-1">
                    <LivePreview control={control} categories={catSearch.options.map(o => ({ categoryName: o.value }))} onExpand={() => setShowFullPreview(true)} />
                </div>
            </div>

            {/* Metadata (Edit only) */}
            {isEdit && existingTool && (existingTool.createdAt || existingTool.updatedAt) && (
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row gap-6 text-xs text-text-tertiary">
                    {existingTool.createdAt && (
                        <div>
                            <span className="font-medium text-text-secondary">Created:</span> {new Date(existingTool.createdAt).toLocaleString()}
                        </div>
                    )}
                    {existingTool.updatedAt && (
                        <div>
                            <span className="font-medium text-text-secondary">Last Updated:</span> {new Date(existingTool.updatedAt).toLocaleString()}
                        </div>
                    )}
                    <div>
                        <span className="font-medium text-text-secondary">ID:</span> <span className="font-mono">{existingTool.id}</span>
                    </div>
                </div>
            )}

            {/* Bottom Action Buttons */}
            <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-border">
                <button type="button" onClick={() => router.back()} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary">Cancel</button>
                <button type="button" onClick={handleSaveAsDraft} disabled={isSubmitting} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:bg-bg-secondary disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save as Draft'}</button>
                {!isEdit && <button type="button" onClick={handleReadyForReview} disabled={isSubmitting} className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Ready for Review'}</button>}
                {isEdit && <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Update'}</button>}
                {isEdit && <button type="button" onClick={handleUpdateAndPost} disabled={isSubmitting} className="px-4 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">{isSubmitting ? 'Posting...' : 'Update & Post'}</button>}
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
                        socialLinks: watch('socialLinks') ? Object.fromEntries(
                            Object.entries(watch('socialLinks') || {}).filter(([_, v]) => v != null)
                        ) as Record<string, string> : undefined,
                    }}
                    categories={[
                        ...(watch('categoryName') || []).map(name => ({ categoryName: name })),
                        ...catSearch.options.filter(o => !(watch('categoryName') || []).includes(o.value)).map(o => ({ categoryName: o.value })),
                    ]}
                    tasks={[
                        ...(watch('taskName') || []).map(name => ({ taskName: name })),
                        ...taskSearch.options.filter(o => !(watch('taskName') || []).includes(o.value)).map(o => ({ taskName: o.value })),
                    ]}
                    onClose={() => setShowFullPreview(false)}
                />
            )}
        </form>
    );
}
