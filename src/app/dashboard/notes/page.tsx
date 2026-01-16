'use client';

import { useAdmin, AdminTool, Note } from '@/context/AdminContext';
import { useState, useMemo, useRef, useEffect } from 'react';
import { renderIcon } from '@/components/features/admin/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';

export default function NotesPage() {
    const { tools, notes, addNote, updateNote, deleteNote } = useAdmin();
    const { showToast, updateToast } = useToast();
    const { confirm } = useConfirm();
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkedTool, setLinkedTool] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTool, setFilterTool] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'block'>('list');

    // Searchable dropdowns
    const [showToolFilter, setShowToolFilter] = useState(false);
    const [toolFilterSearch, setToolFilterSearch] = useState('');
    const [toolFilterIndex, setToolFilterIndex] = useState(-1);
    const [showLinkDropdown, setShowLinkDropdown] = useState(false);
    const [linkSearch, setLinkSearch] = useState('');
    const [linkIndex, setLinkIndex] = useState(0);
    const toolFilterRef = useRef<HTMLDivElement>(null);
    const linkDropdownRef = useRef<HTMLDivElement>(null);
    const toolFilterListRef = useRef<HTMLDivElement>(null);
    const linkListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (toolFilterRef.current && !toolFilterRef.current.contains(e.target as Node)) setShowToolFilter(false);
            if (linkDropdownRef.current && !linkDropdownRef.current.contains(e.target as Node)) setShowLinkDropdown(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Filtered tools for dropdowns
    const toolFilterOptions = useMemo(() => {
        const filtered = toolFilterSearch
            ? tools.filter((t: AdminTool) => (t.name || '').toLowerCase().includes(toolFilterSearch.toLowerCase()))
            : tools;
        return [{ id: '', name: 'All Tools', logoUrl: null }, ...filtered];
    }, [tools, toolFilterSearch]);

    const linkOptions = useMemo(() => {
        const filtered = linkSearch
            ? tools.filter((t: AdminTool) => (t.name || '').toLowerCase().includes(linkSearch.toLowerCase()))
            : tools;
        return [{ id: '', name: 'No tool linked', logoUrl: null }, ...filtered];
    }, [tools, linkSearch]);

    useEffect(() => { setToolFilterIndex(0); }, [toolFilterSearch]);
    useEffect(() => { setLinkIndex(0); }, [linkSearch]);

    useEffect(() => {
        if (toolFilterIndex >= 0 && toolFilterListRef.current) {
            const item = toolFilterListRef.current.children[toolFilterIndex] as HTMLElement;
            if (item) item.scrollIntoView({ block: 'nearest' });
        }
    }, [toolFilterIndex]);
    useEffect(() => {
        if (linkIndex >= 0 && linkListRef.current) {
            const item = linkListRef.current.children[linkIndex] as HTMLElement;
            if (item) item.scrollIntoView({ block: 'nearest' });
        }
    }, [linkIndex]);

    const filteredNotes = useMemo(() => {
        let result = notes;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
        }
        if (filterTool) result = result.filter(n => n.toolId === filterTool);
        if (dateFrom) result = result.filter(n => new Date(n.createdAt) >= new Date(dateFrom));
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59);
            result = result.filter(n => new Date(n.createdAt) <= toDate);
        }
        return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [notes, searchQuery, filterTool, dateFrom, dateTo]);

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getToolName = (toolId: string) => tools.find((t: AdminTool) => t.id === toolId)?.name || 'Unknown';
    const getToolLogo = (toolId: string) => tools.find((t: AdminTool) => t.id === toolId)?.logoUrl || null;
    const selectedToolData = filterTool ? tools.find((t: AdminTool) => t.id === filterTool) : null;

    const createNote = () => { setSelectedNote(null); setIsEditing(true); setTitle(''); setContent(''); setLinkedTool(filterTool || ''); };
    const editNote = (note: Note) => { setSelectedNote(note); setIsEditing(true); setTitle(note.title); setContent(note.content); setLinkedTool(note.toolId || ''); };

    const saveNote = async () => {
        const toastId = showToast(selectedNote ? 'Updating note...' : 'Creating note...', 'loading');
        try {
            if (selectedNote) {
                await updateNote(selectedNote.id, { title, content, toolId: linkedTool || undefined });
                updateToast(toastId, 'Note updated!', 'success');
            } else {
                const newNote = await addNote({ title: title || 'Untitled Note', content, toolId: linkedTool || undefined });
                updateToast(toastId, 'Note created!', 'success');
                if (newNote) setSelectedNote(newNote);
            }
            setIsEditing(false);
        } catch (err) {
            updateToast(toastId, 'Failed to save note', 'error');
        }
    };

    const handleDeleteNote = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Note',
            message: 'Are you sure you want to delete this note? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true
        });
        if (!confirmed) return;
        const toastId = showToast('Deleting note...', 'loading');
        try {
            await deleteNote(id);
            updateToast(toastId, 'Note deleted!', 'success');
            if (selectedNote?.id === id) { setSelectedNote(null); setIsEditing(false); }
        } catch (err) {
            updateToast(toastId, 'Failed to delete note', 'error');
        }
    };

    // Keyboard handlers
    const handleToolFilterKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setToolFilterIndex(i => Math.min(i + 1, toolFilterOptions.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setToolFilterIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); const selected = toolFilterOptions[toolFilterIndex]; setFilterTool(selected.id); setShowToolFilter(false); setToolFilterSearch(''); setSelectedNote(null); setIsEditing(false); }
        else if (e.key === 'Escape') setShowToolFilter(false);
    };

    const handleLinkKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setLinkIndex(i => Math.min(i + 1, linkOptions.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setLinkIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); const selected = linkOptions[linkIndex]; setLinkedTool(selected.id); setShowLinkDropdown(false); setLinkSearch(''); }
        else if (e.key === 'Escape') setShowLinkDropdown(false);
    };

    return (
        <div className="flex h-screen">
            {/* Left Sidebar */}
            <div className="w-96 border-r border-border bg-bg-secondary flex flex-col">
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-bold text-text-primary">Notes</h1>
                        <button onClick={createNote} className="px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm">+ New</button>
                    </div>

                    {/* Search by Tool */}
                    <div className="mb-3">
                        <label className="text-xs text-text-tertiary mb-1 block">Search by Tool</label>
                        <div ref={toolFilterRef} className="relative">
                            <button onClick={() => { setShowToolFilter(!showToolFilter); setToolFilterSearch(''); setToolFilterIndex(0); }}
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-bg-primary border border-border rounded-xl text-sm text-text-primary hover:border-text-tertiary transition-colors">
                                <span className="flex items-center gap-2">
                                    {filterTool && getToolLogo(filterTool) && <img src={getToolLogo(filterTool)!} alt="" className="w-5 h-5 rounded-md" />}
                                    <span className={filterTool ? 'font-medium' : ''}>{filterTool ? getToolName(filterTool) : 'All Tools'}</span>
                                </span>
                                <span className="text-text-tertiary">▾</span>
                            </button>
                            {showToolFilter && (
                                <div className="absolute z-20 w-full mt-1 bg-bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                                    <div className="p-2 border-b border-border">
                                        <input autoFocus value={toolFilterSearch} onChange={e => setToolFilterSearch(e.target.value)} onKeyDown={handleToolFilterKeyDown}
                                            placeholder="Search tools..." className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary" />
                                    </div>
                                    <div ref={toolFilterListRef} className="max-h-48 overflow-y-auto">
                                        {toolFilterOptions.map((tool, idx) => (
                                            <button key={tool.id || 'all'} onClick={() => { setFilterTool(tool.id); setShowToolFilter(false); setToolFilterSearch(''); setSelectedNote(null); setIsEditing(false); }}
                                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 ${idx === toolFilterIndex ? 'bg-bg-tertiary' : 'hover:bg-bg-secondary'} ${filterTool === tool.id ? 'font-medium text-text-primary' : 'text-text-primary'}`}>
                                                {tool.id && tool.logoUrl && <img src={tool.logoUrl} alt="" className="w-5 h-5 rounded-md" />}
                                                <span>{tool.name}</span>
                                            </button>
                                        ))}
                                        {toolFilterOptions.length === 0 && <div className="px-3 py-4 text-center text-text-tertiary text-sm">No tools found</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search Notes */}
                    <div className="mb-3">
                        <label className="text-xs text-text-tertiary mb-1 block">Search Notes</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">{renderIcon('search', 14)}</span>
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by title or content..."
                                className="w-full pl-9 pr-3 py-2.5 bg-bg-primary border border-border rounded-xl text-sm text-text-primary" />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1">
                            <label className="text-xs text-text-tertiary mb-1 block">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-2 py-2 bg-bg-primary border border-border rounded-xl text-xs text-text-primary" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-text-tertiary mb-1 block">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-2 py-2 bg-bg-primary border border-border rounded-xl text-xs text-text-primary" />
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-tertiary">{filteredNotes.length} notes</span>
                        <div className="flex gap-1 bg-bg-primary border border-border rounded-lg p-0.5">
                            <button onClick={() => setViewMode('list')} className={`px-2 py-1 text-xs rounded ${viewMode === 'list' ? 'bg-bg-tertiary text-text-primary' : 'text-text-tertiary'}`}>≡</button>
                            <button onClick={() => setViewMode('block')} className={`px-2 py-1 text-xs rounded ${viewMode === 'block' ? 'bg-bg-tertiary text-text-primary' : 'text-text-tertiary'}`}>▦</button>
                        </div>
                    </div>
                </div>

                {/* Selected Tool Display */}
                {selectedToolData && (
                    <div className="px-4 py-3 bg-accent-primary/5 border-b border-border flex items-center gap-3">
                        {selectedToolData.logoUrl ? <img src={selectedToolData.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 bg-accent-primary/20 rounded-lg flex items-center justify-center text-accent-primary"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg></div>}
                        <div><div className="font-medium text-text-primary text-sm">{selectedToolData.name}</div><div className="text-xs text-text-tertiary">{filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}</div></div>
                    </div>
                )}

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredNotes.length === 0 ? (
                        <div className="text-center py-12"><svg className="w-8 h-8 text-text-tertiary mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg><p className="text-text-tertiary text-sm mb-3">{filterTool ? `No notes for ${getToolName(filterTool)}` : 'No notes yet'}</p><button onClick={createNote} className="text-accent-primary text-sm hover:underline">+ Add new note</button></div>
                    ) : viewMode === 'list' ? (
                        filteredNotes.map(note => (
                            <button key={note.id} onClick={() => { setSelectedNote(note); setIsEditing(false); }} className={`w-full text-left p-3 rounded-xl mb-1 transition-all border ${selectedNote?.id === note.id ? 'bg-bg-tertiary border-accent-primary/30' : 'border-transparent hover:bg-bg-tertiary/50'}`}>
                                <div className="font-medium text-text-primary text-sm truncate">{note.title}</div>
                                <div className="text-xs text-text-tertiary truncate mt-0.5">{note.content.slice(0, 60)}...</div>
                                <div className="flex items-center gap-2 mt-1.5"><span className="text-[10px] text-text-tertiary">{formatDateTime(note.updatedAt)}</span>{note.toolId && !filterTool && <span className="text-[10px] text-accent-primary">• {getToolName(note.toolId)}</span>}</div>
                            </button>
                        ))
                    ) : (
                        <div className="grid grid-cols-2 gap-2">{filteredNotes.map(note => (<button key={note.id} onClick={() => { setSelectedNote(note); setIsEditing(false); }} className={`text-left p-3 rounded-xl border transition-all ${selectedNote?.id === note.id ? 'bg-bg-tertiary border-accent-primary/30' : 'border-border hover:border-accent-primary/30'}`}><div className="font-medium text-text-primary text-xs truncate">{note.title}</div><div className="text-[10px] text-text-tertiary line-clamp-2 mt-0.5">{note.content}</div><div className="text-[9px] text-text-tertiary mt-1">{formatDateTime(note.updatedAt)}</div></button>))}</div>
                    )}
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col bg-bg-primary">
                {isEditing ? (
                    <>
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." className="text-xl font-bold text-text-primary bg-transparent border-none outline-none flex-1" autoFocus />
                            <div className="flex gap-2"><button onClick={() => { setIsEditing(false); setSelectedNote(null); }} className="px-3 py-1.5 text-text-secondary text-sm">Cancel</button><button onClick={saveNote} className="px-4 py-1.5 bg-accent-primary text-white rounded-lg text-sm">Save</button></div>
                        </div>
                        <div className="p-4 border-b border-border">
                            <label className="text-xs text-text-tertiary block mb-1">Link to Tool</label>
                            <div ref={linkDropdownRef} className="relative max-w-sm">
                                <button onClick={() => { setShowLinkDropdown(!showLinkDropdown); setLinkSearch(''); setLinkIndex(0); }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary hover:border-text-tertiary transition-colors">
                                    <span className="flex items-center gap-2">
                                        {linkedTool && getToolLogo(linkedTool) && <img src={getToolLogo(linkedTool)!} alt="" className="w-5 h-5 rounded-md" />}
                                        <span className={linkedTool ? 'font-medium' : ''}>{linkedTool ? getToolName(linkedTool) : 'No tool linked'}</span>
                                    </span>
                                    <span className="text-text-tertiary">▾</span>
                                </button>
                                {showLinkDropdown && (
                                    <div className="absolute z-20 w-full mt-1 bg-bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                                        <div className="p-2 border-b border-border">
                                            <input autoFocus value={linkSearch} onChange={e => setLinkSearch(e.target.value)} onKeyDown={handleLinkKeyDown}
                                                placeholder="Search tools..." className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary" />
                                        </div>
                                        <div ref={linkListRef} className="max-h-48 overflow-y-auto">
                                            {linkOptions.map((tool, idx) => (
                                                <button key={tool.id || 'none'} onClick={() => { setLinkedTool(tool.id); setShowLinkDropdown(false); setLinkSearch(''); }}
                                                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 ${idx === linkIndex ? 'bg-bg-tertiary' : 'hover:bg-bg-secondary'} ${linkedTool === tool.id ? 'font-medium text-text-primary' : 'text-text-primary'}`}>
                                                    {tool.id && tool.logoUrl && <img src={tool.logoUrl} alt="" className="w-5 h-5 rounded-md" />}
                                                    <span>{tool.name}</span>
                                                </button>
                                            ))}
                                            {linkOptions.length === 0 && <div className="px-3 py-4 text-center text-text-tertiary text-sm">No tools found</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Start writing..." className="flex-1 p-4 bg-transparent border-none outline-none resize-none text-text-primary" />
                    </>
                ) : selectedNote ? (
                    <>
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">{selectedNote.toolId && getToolLogo(selectedNote.toolId) && <img src={getToolLogo(selectedNote.toolId)!} alt="" className="w-8 h-8 rounded-lg" />}<div>{selectedNote.toolId && <span className="text-xs text-accent-primary">{getToolName(selectedNote.toolId)}</span>}<h2 className="text-xl font-bold text-text-primary">{selectedNote.title}</h2></div></div>
                            <div className="flex gap-2"><button onClick={() => editNote(selectedNote)} className="px-3 py-1.5 text-text-secondary hover:text-text-primary text-sm flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> Edit</button><button onClick={() => handleDeleteNote(selectedNote.id)} className="px-3 py-1.5 text-accent-red text-sm flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> Delete</button></div>
                        </div>
                        <div className="flex-1 p-4 text-text-secondary whitespace-pre-wrap overflow-y-auto">{selectedNote.content || 'No content...'}</div>
                        <div className="p-4 border-t border-border text-xs text-text-tertiary flex gap-4"><span>Created: {formatDateTime(selectedNote.createdAt)}</span><span>Updated: {formatDateTime(selectedNote.updatedAt)}</span></div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-text-tertiary"><div className="text-center"><svg className="w-10 h-10 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg><p>Select a note or create a new one</p></div></div>
                )}
            </div>
        </div>
    );
}
