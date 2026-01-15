'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

// Link Modal Component - Centered on screen
const LinkModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialUrl = '',
    initialText = ''
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (url: string, text: string) => void;
    initialUrl?: string;
    initialText?: string;
}) => {
    const [url, setUrl] = useState(initialUrl);
    const [text, setText] = useState(initialText);

    useEffect(() => {
        setUrl(initialUrl);
        setText(initialText);
    }, [initialUrl, initialText, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (url.trim()) {
            onSubmit(url.trim(), text.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/20" />
            <div
                className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 w-72 shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="space-y-3" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (url.trim()) onSubmit(url.trim(), text.trim()); } }}>
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Link Text</label>
                        <input
                            type="text"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Display text (optional)"
                            className="w-full px-2 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">URL *</label>
                        <input
                            type="text"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="flex-1 px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (url.trim()) onSubmit(url.trim(), text.trim()); }}
                            className="flex-1 px-2 py-1.5 text-xs bg-[var(--accent-primary)] text-white rounded hover:opacity-90"
                        >
                            {initialUrl ? 'Update' : 'Insert Link'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function RichTextEditor({ value, onChange, placeholder = 'Write something...' }: RichTextEditorProps) {
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [htmlSource, setHtmlSource] = useState(value);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkInitialUrl, setLinkInitialUrl] = useState('');
    const [linkInitialText, setLinkInitialText] = useState('');

    // Track internal updates to prevent update loops
    const isInternalUpdate = useRef(false);

    const extensions = useMemo(() => [
        StarterKit.configure({
            bulletList: { keepMarks: true, keepAttributes: false },
            orderedList: { keepMarks: true, keepAttributes: false },
        }),
        Placeholder.configure({ placeholder }),
        Underline.extend({ name: 'customUnderline' }),
        Link.extend({ name: 'customLink' }).configure({
            openOnClick: false,
            HTMLAttributes: {
                class: 'text-[var(--accent-primary)] underline',
                target: '_blank',
                rel: 'noopener noreferrer',
            },
        }),
    ], [placeholder]);

    const editor = useEditor({
        extensions,
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            // Skip if this is an internal update
            if (isInternalUpdate.current) {
                isInternalUpdate.current = false;
                return;
            }
            const html = editor.getHTML();
            onChange(html);
            setHtmlSource(html);
        },
        editorProps: {
            attributes: { class: 'rich-text-content min-h-[150px] p-4 focus:outline-none' },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            isInternalUpdate.current = true;
            editor.commands.setContent(value);
            setHtmlSource(value);
        }
    }, [value, editor]);

    const toggleHtmlMode = () => {
        if (isHtmlMode) {
            editor?.commands.setContent(htmlSource);
            onChange(htmlSource);
        } else {
            setHtmlSource(editor?.getHTML() || '');
        }
        setIsHtmlMode(!isHtmlMode);
    };

    const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setHtmlSource(e.target.value);
        onChange(e.target.value);
    };

    const openLinkModal = useCallback(() => {
        const existingUrl = editor?.getAttributes('customLink').href || '';
        const selectedText = editor?.state.selection.empty ? '' :
            editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, '') || '';
        setLinkInitialUrl(existingUrl);
        setLinkInitialText(selectedText);
        setLinkModalOpen(true);
    }, [editor]);

    const handleLinkSubmit = useCallback((url: string, text: string) => {
        if (!editor) return;

        // Ensure URL has protocol
        const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

        // If there's selected text, replace it with the link
        if (!editor.state.selection.empty) {
            if (text) {
                // Replace selection with new text and link, then unset link mark
                editor.chain().focus()
                    .deleteSelection()
                    .insertContent({
                        type: 'text',
                        text: text,
                        marks: [{ type: 'customLink', attrs: { href: fullUrl } }]
                    })
                    .unsetMark('customLink')
                    .run();
            } else {
                // Just apply link to selected text
                editor.chain().focus().setLink({ href: fullUrl }).run();
            }
        } else if (text) {
            // No selection, insert new text with link, then unset link mark
            editor.chain().focus()
                .insertContent({
                    type: 'text',
                    text: text,
                    marks: [{ type: 'customLink', attrs: { href: fullUrl } }]
                })
                .unsetMark('customLink')
                .run();
        } else {
            // No selection, no text - just set link on word at cursor
            editor.chain().focus().setLink({ href: fullUrl }).run();
        }

        setLinkModalOpen(false);
    }, [editor]);

    const removeLink = useCallback(() => {
        editor?.chain().focus().extendMarkRange('customLink').unsetLink().run();
    }, [editor]);

    return (
        <div className="border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] overflow-visible">
            <LinkModal
                isOpen={linkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onSubmit={handleLinkSubmit}
                initialUrl={linkInitialUrl}
                initialText={linkInitialText}
            />

            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                {!isHtmlMode && (
                    <>
                        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}
                            className={`px-2 py-1 rounded text-sm font-bold ${editor?.isActive('bold') ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>B</button>
                        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}
                            className={`px-2 py-1 rounded text-sm italic ${editor?.isActive('italic') ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>I</button>
                        <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()}
                            className={`px-2 py-1 rounded text-sm underline ${editor?.isActive('customUnderline') ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>U</button>
                        <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()}
                            className={`px-2 py-1 rounded text-sm line-through ${editor?.isActive('strike') ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>S</button>

                        <div className="w-px h-5 bg-[var(--border-color)] mx-1" />

                        <button type="button" onClick={openLinkModal}
                            className={`px-2 py-1 rounded text-sm ${editor?.isActive('customLink') ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>🔗</button>
                        {editor?.isActive('customLink') && (
                            <button type="button" onClick={removeLink} className="px-1 py-1 rounded text-sm text-[var(--accent-red)] hover:bg-[var(--bg-tertiary)]">✕</button>
                        )}

                        <div className="w-px h-5 bg-[var(--border-color)] mx-1" />

                        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={`px-2 py-1 rounded text-sm font-semibold ${editor?.isActive('heading', { level: 2 }) ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>H2</button>
                        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={`px-2 py-1 rounded text-sm font-semibold ${editor?.isActive('heading', { level: 3 }) ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>H3</button>

                        <div className="w-px h-5 bg-[var(--border-color)] mx-1" />

                        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}
                            className={`px-2 py-1 rounded text-sm ${editor?.isActive('bulletList') ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>•</button>
                        <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                            className={`px-2 py-1 rounded text-sm ${editor?.isActive('orderedList') ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>1.</button>
                        <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                            className={`px-2 py-1 rounded text-sm ${editor?.isActive('blockquote') ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>❝</button>
                        <button type="button" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                            className={`px-2 py-1 rounded text-sm font-mono ${editor?.isActive('codeBlock') ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>&lt;/&gt;</button>
                    </>
                )}
                <div className="flex-1" />
                <button type="button" onClick={toggleHtmlMode}
                    className={`px-2 py-1 rounded text-xs font-mono ${isHtmlMode ? 'bg-[var(--accent-purple)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)]'}`}>
                    {isHtmlMode ? '← Visual' : 'HTML'}
                </button>
            </div>

            {isHtmlMode ? (
                <textarea
                    value={htmlSource}
                    onChange={handleHtmlChange}
                    className="w-full min-h-[150px] p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm resize-y focus:outline-none"
                    placeholder="<p>Enter HTML...</p>"
                    spellCheck={false}
                />
            ) : (
                <EditorContent editor={editor} />
            )}

            <style jsx global>{`
                .rich-text-content { color: var(--text-primary); }
                .rich-text-content p { margin: 0.5em 0; }
                .rich-text-content p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: var(--text-tertiary);
                    pointer-events: none;
                    height: 0;
                }
                .rich-text-content h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
                .rich-text-content h3 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
                .rich-text-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
                .rich-text-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
                .rich-text-content li { margin: 0.25rem 0; }
                .rich-text-content li p { margin: 0; }
                .rich-text-content blockquote {
                    border-left: 4px solid var(--accent-primary);
                    padding: 0.5rem 1rem;
                    margin: 0.5rem 0;
                    background: var(--accent-primary-bg);
                    border-radius: 0 6px 6px 0;
                    font-style: italic;
                }
                .rich-text-content pre { background: var(--bg-tertiary); padding: 1rem; border-radius: 6px; margin: 0.5rem 0; }
                .rich-text-content code { font-family: monospace; font-size: 0.9em; background: var(--bg-tertiary); padding: 0.2em 0.4em; border-radius: 3px; }
                .rich-text-content pre code { background: none; padding: 0; }
                .rich-text-content a { color: var(--accent-primary); text-decoration: underline; }
            `}</style>
        </div>
    );
}
