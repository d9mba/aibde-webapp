'use client';

import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { useEffect, useState, useMemo, useRef } from 'react';
import EditorToolbar from './editor/EditorToolbar';
import ImageNodeView from './editor/ImageNodeView';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onImageInsert?: (file: File) => Promise<string>;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing...', onImageInsert }: RichTextEditorProps) {
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    const [htmlSource, setHtmlSource] = useState(value);
    const isInternalUpdate = useRef(false);

    const extensions = useMemo(() => [
        StarterKit.configure({
            bulletList: { keepMarks: true, keepAttributes: false },
            orderedList: { keepMarks: true, keepAttributes: false },
            heading: { levels: [1, 2, 3, 4] },
            link: {
                openOnClick: false,
                HTMLAttributes: {
                    class: 'tiptap-link',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            },
        }),
        Placeholder.configure({ placeholder }),
        Image.extend({
            addNodeView() {
                return ReactNodeViewRenderer(ImageNodeView);
            },
        }).configure({
            inline: false,
            allowBase64: true,
        }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        Youtube.configure({
            inline: false,
            HTMLAttributes: { class: 'tiptap-youtube' },
        }),
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        Subscript,
        Superscript,
    ], [placeholder]);

    const editor = useEditor({
        extensions,
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            if (isInternalUpdate.current) {
                isInternalUpdate.current = false;
                return;
            }
            const html = editor.getHTML();
            onChange(html);
            setHtmlSource(html);
        },
        editorProps: {
            attributes: { class: 'tiptap-content' },
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

    const wordCount = editor?.storage.characterCount?.words?.() ?? 
        (editor?.state.doc.textContent.split(/\s+/).filter(Boolean).length ?? 0);

    return (
        <div className="tiptap-editor-wrapper">
            {/* Toolbar */}
            {!isHtmlMode && <EditorToolbar editor={editor} onImageInsert={onImageInsert} />}

            {/* Mode toggle */}
            <div className="flex items-center justify-between px-3 py-1 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <span className="text-[10px] text-[var(--text-tertiary)]">
                    {!isHtmlMode && editor ? `${wordCount} words` : 'HTML Source'}
                </span>
                <button
                    type="button"
                    onClick={toggleHtmlMode}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                        isHtmlMode 
                            ? 'bg-[var(--accent-primary)] text-white' 
                            : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)]'
                    }`}
                >
                    {isHtmlMode ? '← Visual' : '</>'}
                </button>
            </div>

            {/* Editor area */}
            {isHtmlMode ? (
                <textarea
                    value={htmlSource}
                    onChange={handleHtmlChange}
                    className="w-full min-h-[400px] p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm resize-y focus:outline-none border-none"
                    placeholder="<p>Enter HTML...</p>"
                    spellCheck={false}
                />
            ) : (
                <EditorContent editor={editor} />
            )}
        </div>
    );
}
