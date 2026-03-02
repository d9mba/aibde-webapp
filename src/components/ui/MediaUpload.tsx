'use client';

import { useState, useRef } from 'react';
import { getFullUrl, CDN_URL } from '@/lib/url';
import UploadIcon from '@/assets/svg/actions/upload.svg';

const getRelativePath = (url: string): string => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) return url;
    // Only strip our specific CDN domain with origin boundary check
    if (CDN_URL) {
        try {
            const parsed = new URL(url);
            const cdnOrigin = new URL(CDN_URL).origin;
            if (parsed.origin === cdnOrigin) {
                const stripped = url.replace(CDN_URL, '');
                return stripped.startsWith('/') ? stripped : '/' + stripped;
            }
        } catch { /* invalid URL, return as-is */ }
    }
    return url;
};

// Helper function to get source badge label and color
function getSourceBadge(isCloud: boolean, isExternal: boolean): { label: string; color: string } {
    if (isCloud) return { label: 'Cloud', color: 'bg-accent-primary' };
    if (isExternal) return { label: 'External', color: 'bg-amber-500' };
    return { label: 'Local', color: 'bg-gray-500' };
}

const isUploadedFile = (url: string): boolean => {
    if (!url) return false;
    // Relative paths are our uploaded files (exclude protocol-relative //cdn.example.com)
    if (url.startsWith('/') && !url.startsWith('//')) return true;
    // Only match our specific CDN domain with origin boundary check
    if (CDN_URL) {
        try {
            const parsed = new URL(url);
            const cdnOrigin = new URL(CDN_URL).origin;
            if (parsed.origin === cdnOrigin) return true;
        } catch { /* invalid URL */ }
    }
    return false;
};

const cleanupFile = async (url: string) => {
    if (!isUploadedFile(url)) {
        return;
    }

    try {
        const path = getRelativePath(url);
        untrackUpload(path);

        await fetch('/api/upload/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: [path] }),
        });
    } catch {
        // Silently fail
    }
};

const UPLOAD_KEY = 'pending_uploads';

// Track new uploads for cleanup on cancel/reload
const trackUpload = (path: string) => {
    const pending = JSON.parse(sessionStorage.getItem(UPLOAD_KEY) || '[]');
    if (!pending.includes(path)) {
        pending.push(path);
        sessionStorage.setItem(UPLOAD_KEY, JSON.stringify(pending));
    }
};

// Remove from pending (when removed manually or saved)
const untrackUpload = (path: string) => {
    const pending = JSON.parse(sessionStorage.getItem(UPLOAD_KEY) || '[]');
    const updated = pending.filter((p: string) => p !== path);
    sessionStorage.setItem(UPLOAD_KEY, JSON.stringify(updated));
};

interface MediaUploadProps {
    label?: string;
    accept?: string;
    uploadType?: 'logo' | 'image' | 'video' | 'default';
    mediaType?: 'image' | 'video';
    placeholder?: string;
    toolName?: string; // Name for friendly filenames like "chatgpt.webp"
    // Single mode (default) vs Multi mode
    multiple?: boolean;
    value?: string;
    onChange?: (value: string) => void;
    // Multi mode
    items?: string[];
    onItemsChange?: (items: string[]) => void;
    itemAlts?: string[];
    onAltsChange?: (alts: string[]) => void;
    showAltText?: boolean;
}

export default function MediaUpload({
    label,
    accept = 'image/*',
    uploadType = 'default',
    mediaType = 'image',
    placeholder,
    toolName = '',
    multiple = false,
    value = '',
    onChange,
    items = [],
    onItemsChange,
    itemAlts = [],
    onAltsChange,
    showAltText = true,
}: MediaUploadProps) {
    const [mode, setMode] = useState<'direct' | 'fetch' | 'upload'>('direct');
    const [url, setUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isVideo = mediaType === 'video' || accept.includes('video');
    const placeholderText = placeholder || (isVideo ? 'Paste video URL...' : 'Paste image URL...');

    // Normalize to array for internal handling
    const currentItems = multiple ? items : (value ? [value] : []);
    const currentAlts = multiple ? itemAlts : [];

    const setItems = (newItems: string[]) => {
        if (multiple && onItemsChange) {
            onItemsChange(newItems);
        } else if (!multiple && onChange) {
            onChange(newItems[0] || '');
        }
    };

    const setAlts = (newAlts: string[]) => {
        if (multiple && onAltsChange) {
            onAltsChange(newAlts);
        }
    };

    const addDirectUrl = () => {
        if (!url.trim()) return;
        if (!multiple && currentItems.length > 0) {
            setItems([url.trim()]);
        } else {
            setItems([...currentItems, url.trim()]);
            setAlts([...currentAlts, '']);
        }
        setUrl('');
        setError(null);
    };

    const fetchAndUpload = async () => {
        if (!url.trim()) return;
        setIsUploading(true);
        setError(null);
        try {
            const response = await fetch('/api/upload/from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim(), type: uploadType, name: toolName }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to fetch');
            const relativePath = result.path; // Store relative path for DB
            trackUpload(relativePath); // Track for cleanup
            if (!multiple && currentItems.length > 0) {
                await cleanupFile(currentItems[0]);
                setItems([relativePath]);
            } else {
                setItems([...currentItems, relativePath]);
                setAlts([...currentAlts, '']);
            }
            setUrl('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        setIsUploading(true);
        setError(null);
        try {
            const newItems: string[] = [];
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', uploadType);
                if (toolName) formData.append('name', toolName);
                const response = await fetch('/api/upload', { method: 'POST', body: formData });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Upload failed');
                const relativePath = result.path; // Store relative path for DB
                trackUpload(relativePath); // Track for cleanup
                newItems.push(relativePath);
            }
            if (!multiple) {
                if (currentItems.length > 0) await cleanupFile(currentItems[0]);
                setItems([newItems[0]]);
            } else {
                setItems([...currentItems, ...newItems]);
                setAlts([...currentAlts, ...newItems.map(() => '')]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeItem = async (index: number) => {
        await cleanupFile(currentItems[index]);
        setItems(currentItems.filter((_, i) => i !== index));
        setAlts(currentAlts.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-bg-tertiary rounded-lg w-fit">
                <button type="button" className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'direct' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`} onClick={() => setMode('direct')}>Direct URL</button>
                <button type="button" className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'fetch' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`} onClick={() => setMode('fetch')}>URL → Cloud</button>
                <button type="button" className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'upload' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`} onClick={() => setMode('upload')}>Upload</button>
            </div>

            {/* Input Area */}
            {mode === 'direct' && (
                <div className="flex gap-2">
                    <input value={url} onChange={e => setUrl(e.target.value)} placeholder={placeholderText} className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDirectUrl())} />
                    <button type="button" onClick={addDirectUrl} className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm">{multiple ? 'Add' : 'Set'}</button>
                </div>
            )}

            {mode === 'fetch' && (
                <div className="flex gap-2">
                    <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste URL to upload to cloud..." className="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary" disabled={isUploading} />
                    <button type="button" onClick={fetchAndUpload} disabled={isUploading || !url.trim()} className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm disabled:opacity-50">{isUploading ? 'Uploading...' : 'Upload'}</button>
                </div>
            )}

            {mode === 'upload' && (
                <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept={accept} multiple={multiple} onChange={handleFileChange} className="hidden" disabled={isUploading} />
                    <button type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-secondary rounded-lg hover:text-text-primary disabled:opacity-50" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <span className="animate-spin">↻</span> : <UploadIcon className="w-5 h-5" />}
                        {isUploading ? 'Uploading...' : (multiple ? 'Choose Files' : 'Choose File')}
                    </button>
                    {multiple && <span className="text-xs text-text-tertiary">Multiple files allowed</span>}
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Preview */}
            {currentItems.length > 0 && (
                <div className={multiple ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" : ""}>
                    {currentItems.map((item, i) => {
                        // Determine source type for badge
                        const isCloud = isUploadedFile(item);
                        const isExternal = item.startsWith('http') && !isCloud;
                        const { label: sourceLabel, color: sourceColor } = getSourceBadge(isCloud, isExternal);

                        return (
                            <div key={i} className="relative group inline-block">
                                {isVideo ? (
                                    <video src={getFullUrl(item)} controls className={`rounded-lg border border-border object-cover ${multiple ? 'w-full h-32' : 'max-w-[200px] max-h-[150px]'}`} />
                                ) : (
                                    <img src={getFullUrl(item)} alt={currentAlts[i] || ''} className={`rounded-lg border border-border object-cover ${multiple ? 'w-full h-32' : 'max-w-[200px] max-h-[150px]'}`} />
                                )}
                                {/* Source badge */}
                                <span className={`absolute bottom-1 left-1 px-1.5 py-0.5 ${sourceColor} text-white text-[9px] font-medium rounded`}>
                                    {sourceLabel}
                                </span>
                                <button type="button" onClick={() => removeItem(i)} className="absolute top-1 right-1 w-6 h-6 bg-accent-red text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                {showAltText && !isVideo && multiple && onAltsChange && (
                                    <input value={currentAlts[i] || ''} onChange={e => { const a = [...currentAlts]; a[i] = e.target.value; setAlts(a); }} placeholder="Alt text..." className="w-full mt-1 px-2 py-1 bg-bg-secondary border border-border rounded text-xs text-text-primary" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
