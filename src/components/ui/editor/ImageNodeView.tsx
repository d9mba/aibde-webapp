'use client';

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { X } from 'lucide-react';

export default function ImageNodeView({ node, deleteNode, selected }: NodeViewProps) {
    return (
        <NodeViewWrapper className="tiptap-image-wrapper" data-drag-handle>
            <div className={`relative inline-block group ${selected ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 rounded-lg' : ''}`}>
                <img
                    src={node.attrs.src}
                    alt={node.attrs.alt || ''}
                    title={node.attrs.title || ''}
                    className="tiptap-image max-w-full rounded-lg"
                    draggable={false}
                />
                {/* Delete button — visible on hover */}
                <button
                    type="button"
                    onClick={deleteNode}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg hover:bg-red-600"
                    title="Remove image"
                >
                    <X size={14} />
                </button>
            </div>
        </NodeViewWrapper>
    );
}
