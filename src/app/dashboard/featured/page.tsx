'use client';

import { useState, useMemo } from 'react';
import { useAdmin, AdminTool } from '@/context/AdminContext';
import { Search } from 'lucide-react';

export default function FeaturedPage() {
    const { tools, updateTool } = useAdmin();
    const [search, setSearch] = useState('');

    const featuredTools = tools.filter((t: AdminTool) => t.isFeatured && !t.spotlightEnabled);
    const spotlightTools = tools.filter((t: AdminTool) => t.spotlightEnabled);
    const regularTools = tools.filter((t: AdminTool) => !t.isFeatured && !t.spotlightEnabled && t.status === 'published');

    // Filter regular tools by search - show only 5 when not searching
    const filteredRegularTools = useMemo(() => {
        if (!search) return regularTools.slice(0, 5);
        const searchLower = search.toLowerCase();
        return regularTools.filter(t =>
            t.name.toLowerCase().includes(searchLower) ||
            (t.categoryName || []).some(cat => cat.toLowerCase().includes(searchLower))
        );
    }, [regularTools, search]);

    const toggleFeatured = (toolId: string, isFeatured: boolean) => {
        updateTool(toolId, { isFeatured });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Featured Tools</h1>
                    <p className="text-text-secondary text-sm mt-1">Boosted tools appear more frequently in search and lists</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-accent-primary">{spotlightTools.length}</div>
                    <div className="text-sm text-text-secondary">Spotlight (Hero)</div>
                </div>
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-accent-green">{featuredTools.length}</div>
                    <div className="text-sm text-text-secondary">Featured (Boosted)</div>
                </div>
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-text-tertiary">{regularTools.length}</div>
                    <div className="text-sm text-text-secondary">Regular</div>
                </div>
            </div>

            {/* Currently Featured */}
            <div className="bg-bg-card border border-border rounded-xl p-4 mb-6">
                <h3 className="font-medium text-text-primary mb-4">Currently Featured</h3>
                {featuredTools.length === 0 ? (
                    <p className="text-text-tertiary text-sm">No featured tools. Add tools below.</p>
                ) : (
                    <div className="space-y-2">
                        {featuredTools.map((tool: AdminTool) => (
                            <div key={tool.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                                <div className="flex items-center gap-3">
                                    {tool.logoUrl && <img src={tool.logoUrl} alt="" className="w-8 h-8 rounded" />}
                                    <div>
                                        <div className="font-medium text-text-primary">{tool.name}</div>
                                        <div className="text-xs text-text-tertiary">{(tool.categoryName || []).join(', ') || '-'}</div>
                                    </div>
                                </div>
                                <button onClick={() => toggleFeatured(tool.id, false)} className="px-3 py-1 text-sm text-accent-red hover:bg-accent-red/10 rounded">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Featured */}
            <div className="bg-bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-text-primary">Add to Featured</h3>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search tools..."
                        className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-tertiary"
                    />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredRegularTools.map((tool: AdminTool) => (
                        <div key={tool.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                            <div className="flex items-center gap-3">
                                {tool.logoUrl && <img src={tool.logoUrl} alt="" className="w-8 h-8 rounded" />}
                                <div>
                                    <div className="font-medium text-text-primary">{tool.name}</div>
                                    <div className="text-xs text-text-tertiary">{(tool.categoryName || []).join(', ') || '-'}</div>
                                </div>
                            </div>
                            <button onClick={() => toggleFeatured(tool.id, true)} className="px-3 py-1 text-sm text-accent-primary hover:bg-accent-primary/10 rounded">
                                + Feature
                            </button>
                        </div>
                    ))}
                    {filteredRegularTools.length === 0 && (
                        <p className="text-text-tertiary text-sm text-center py-4">
                            {search ? 'No tools found matching your search.' : 'No published tools available.'}
                        </p>
                    )}
                    {!search && regularTools.length > 5 && (
                        <p className="text-text-tertiary text-xs text-center py-2 border-t border-border">
                            Showing 5 of {regularTools.length} tools. Search to find more.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
