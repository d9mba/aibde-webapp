'use client';

import { Editor } from '@tiptap/react';
import { useState, useCallback, useRef } from 'react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Quote, Code, Minus,
    Image as ImageIcon, Table as TableIcon, Youtube,
    Link as LinkIcon, Unlink, Undo2, Redo2,
    Heading1, Heading2, Heading3, Heading4,
    Highlighter, Subscript, Superscript,
    Rows3, Columns3, Trash2,
    ChevronDown, Upload, Globe, Loader2,
} from 'lucide-react';

interface ToolbarProps {
    editor: Editor | null;
    onImageInsert?: (file: File) => Promise<string>;
}

function ToolbarButton({ 
    onClick, active, disabled, title, children 
}: { 
    onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode 
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded-md transition-colors ${
                active 
                    ? 'bg-[var(--accent-primary)] text-white' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-6 bg-[var(--border-color)] mx-0.5 flex-shrink-0" />;
}

function HeadingDropdown({ editor }: { editor: Editor }) {
    const [open, setOpen] = useState(false);

    const currentLevel = [1, 2, 3, 4].find(l => editor.isActive('heading', { level: l }));
    const label = currentLevel ? `H${currentLevel}` : 'Text';

    const items = [
        { label: 'Normal Text', action: () => editor.chain().focus().setParagraph().run(), active: !currentLevel },
        { label: 'Heading 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: currentLevel === 1, icon: <Heading1 size={14} /> },
        { label: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: currentLevel === 2, icon: <Heading2 size={14} /> },
        { label: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: currentLevel === 3, icon: <Heading3 size={14} /> },
        { label: 'Heading 4', action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), active: currentLevel === 4, icon: <Heading4 size={14} /> },
    ];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer min-w-[70px]"
            >
                {label}
                <ChevronDown size={12} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl py-1 min-w-[160px]">
                        {items.map(item => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => { item.action(); setOpen(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors cursor-pointer ${
                                    item.active ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                                }`}
                            >
                                {item.icon && item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function EditorToolbar({ editor, onImageInsert }: ToolbarProps) {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [showImageMenu, setShowImageMenu] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const insertLink = useCallback(() => {
        if (!editor || !linkUrl.trim()) return;
        const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
        editor.chain().focus().setLink({ href: url }).run();
        setLinkUrl('');
        setShowLinkInput(false);
    }, [editor, linkUrl]);

    const insertYoutube = useCallback(() => {
        if (!editor || !youtubeUrl.trim()) return;
        editor.commands.setYoutubeVideo({ src: youtubeUrl });
        setYoutubeUrl('');
        setShowYoutubeInput(false);
    }, [editor, youtubeUrl]);

    const insertTable = useCallback(() => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    // Image: insert from URL
    const insertImageFromUrl = useCallback(() => {
        if (!editor || !imageUrl.trim()) return;
        const url = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
        editor.chain().focus().setImage({ src: url }).run();
        setImageUrl('');
        setShowImageMenu(false);
    }, [editor, imageUrl]);

    // Image: upload file
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        setImageUploading(true);
        try {
            if (onImageInsert) {
                const url = await onImageInsert(file);
                editor.chain().focus().setImage({ src: url }).run();
            } else {
                // Fallback: read as base64
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        editor.chain().focus().setImage({ src: reader.result }).run();
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch {
            // Error handled by parent
        } finally {
            setImageUploading(false);
            setShowImageMenu(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [editor, onImageInsert]);

    if (!editor) return null;

    return (
        <div className="tiptap-toolbar">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Row 1: Main formatting */}
            <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-[var(--border-color)]">
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                    <Undo2 size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                    <Redo2 size={15} />
                </ToolbarButton>

                <Divider />

                <HeadingDropdown editor={editor} />

                <Divider />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                    <Bold size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                    <Italic size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                    <UnderlineIcon size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
                    <Highlighter size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
                    <Subscript size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
                    <Superscript size={15} />
                </ToolbarButton>

                <Divider />

                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
                    <AlignLeft size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
                    <AlignCenter size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
                    <AlignRight size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
                    <AlignJustify size={15} />
                </ToolbarButton>

                <Divider />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                    <List size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
                    <ListOrdered size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
                    <Quote size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
                    <Code size={15} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
                    <Minus size={15} />
                </ToolbarButton>

                <Divider />

                {/* Link */}
                <div className="relative">
                    <ToolbarButton 
                        onClick={() => {
                            if (editor.isActive('link')) {
                                editor.chain().focus().unsetLink().run();
                            } else {
                                setShowLinkInput(!showLinkInput);
                            }
                        }} 
                        active={editor.isActive('link')} 
                        title={editor.isActive('link') ? 'Remove Link' : 'Insert Link'}
                    >
                        {editor.isActive('link') ? <Unlink size={15} /> : <LinkIcon size={15} />}
                    </ToolbarButton>
                    {showLinkInput && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowLinkInput(false)} />
                            <div className="absolute top-full left-0 mt-1 z-50 flex gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl p-2 min-w-[280px]">
                                <input
                                    type="text"
                                    value={linkUrl}
                                    onChange={e => setLinkUrl(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && insertLink()}
                                    placeholder="https://example.com"
                                    autoFocus
                                    className="flex-1 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                                <button type="button" onClick={insertLink} className="px-2 py-1 bg-[var(--accent-primary)] text-white rounded text-xs cursor-pointer">Insert</button>
                            </div>
                        </>
                    )}
                </div>

                {/* Image — Notion-style dropdown with Upload + URL */}
                <div className="relative">
                    <ToolbarButton onClick={() => setShowImageMenu(!showImageMenu)} title="Insert Image">
                        {imageUploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                    </ToolbarButton>
                    {showImageMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowImageMenu(false)} />
                            <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl p-3 min-w-[300px] space-y-3">
                                {/* Upload option */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer text-left"
                                >
                                    <Upload size={16} className="text-[var(--accent-primary)] flex-shrink-0" />
                                    <div>
                                        <div className="text-sm font-medium text-[var(--text-primary)]">Upload Image</div>
                                        <div className="text-[10px] text-[var(--text-tertiary)]">JPG, PNG, WebP, GIF up to 10MB</div>
                                    </div>
                                </button>
                                {/* URL option */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 px-1">
                                        <Globe size={13} className="text-[var(--text-tertiary)]" />
                                        <span className="text-xs text-[var(--text-tertiary)]">Or paste image URL</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <input
                                            type="text"
                                            value={imageUrl}
                                            onChange={e => setImageUrl(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && insertImageFromUrl()}
                                            placeholder="https://example.com/image.png"
                                            className="flex-1 px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                        <button type="button" onClick={insertImageFromUrl} className="px-2.5 py-1.5 bg-[var(--accent-primary)] text-white rounded text-xs cursor-pointer">Insert</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* YouTube */}
                <div className="relative">
                    <ToolbarButton onClick={() => setShowYoutubeInput(!showYoutubeInput)} title="Embed YouTube">
                        <Youtube size={15} />
                    </ToolbarButton>
                    {showYoutubeInput && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowYoutubeInput(false)} />
                            <div className="absolute top-full right-0 mt-1 z-50 flex gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl p-2 min-w-[300px]">
                                <input
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={e => setYoutubeUrl(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && insertYoutube()}
                                    placeholder="https://youtube.com/watch?v=..."
                                    autoFocus
                                    className="flex-1 px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                                <button type="button" onClick={insertYoutube} className="px-2 py-1 bg-[var(--accent-primary)] text-white rounded text-xs cursor-pointer">Embed</button>
                            </div>
                        </>
                    )}
                </div>

                {/* Table */}
                <ToolbarButton onClick={insertTable} active={editor.isActive('table')} title="Insert Table">
                    <TableIcon size={15} />
                </ToolbarButton>

                {/* Table controls (shown when inside a table) */}
                {editor.isActive('table') && (
                    <>
                        <Divider />
                        <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">
                            <Columns3 size={15} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">
                            <Rows3 size={15} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">
                            <Columns3 size={15} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">
                            <Rows3 size={15} />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
                            <Trash2 size={15} />
                        </ToolbarButton>
                    </>
                )}
            </div>
        </div>
    );
}
