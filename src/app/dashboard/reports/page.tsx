'use client';

import { useAdmin, AdminTool, Category, Task } from '@/context/AdminContext';
import { renderIcon } from '@/components/features/admin/AdminLayout';

export default function ReportsPage() {
    const { tools, categories, tasks } = useAdmin();

    const mockSearchKeywords = [
        { keyword: 'AI writing', count: 1245 },
        { keyword: 'image generator', count: 892 },
        { keyword: 'chatbot', count: 756 },
        { keyword: 'code assistant', count: 634 },
        { keyword: 'video editor', count: 521 },
    ];

    const mockTopTools = tools.slice(0, 5).map((t: AdminTool, i: number) => ({
        ...t,
        views: Math.floor(Math.random() * 5000) + 500,
        clicks: Math.floor(Math.random() * 1000) + 100,
    }));

    const publishedCount = tools.filter((t: AdminTool) => t.status === 'published').length;
    const pendingCount = tools.filter((t: AdminTool) => t.status === 'pending').length;
    const draftCount = tools.filter((t: AdminTool) => t.status === 'draft').length;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Reports & Analytics</h1>
                    <p className="text-text-secondary text-sm mt-1">Track performance and user behavior</p>
                </div>
                <div className="px-3 py-1 bg-accent-purple/10 text-accent-purple rounded text-sm flex items-center gap-2">
                    {renderIcon('link', 14)} PostHog Integration
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <div className="text-3xl font-bold text-text-primary">{tools.length}</div>
                    <div className="text-sm text-text-secondary">Total Tools</div>
                </div>
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <div className="text-3xl font-bold text-accent-green">{publishedCount}</div>
                    <div className="text-sm text-text-secondary">Published</div>
                </div>
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <div className="text-3xl font-bold text-accent-yellow">{pendingCount}</div>
                    <div className="text-sm text-text-secondary">Pending Review</div>
                </div>
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <div className="text-3xl font-bold text-text-tertiary">{draftCount}</div>
                    <div className="text-sm text-text-secondary">Drafts</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Search Keywords */}
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                        {renderIcon('search', 18)} Top Search Keywords
                    </h3>
                    <div className="space-y-3">
                        {mockSearchKeywords.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-text-secondary">{item.keyword}</span>
                                <span className="text-sm font-medium text-text-primary">{item.count.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-text-tertiary mt-4 pt-4 border-t border-border">
                        Data from PostHog (demo)
                    </p>
                </div>

                {/* Top Tools */}
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                        {renderIcon('chart', 18)} Top Performing Tools
                    </h3>
                    <div className="space-y-3">
                        {mockTopTools.map((tool, i) => (
                            <div key={tool.id} className="flex items-center justify-between p-2 bg-bg-secondary rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-text-tertiary text-sm w-4">{i + 1}</span>
                                    <span className="text-text-primary font-medium">{tool.name}</span>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-text-secondary">{tool.views} views</span>
                                    <span className="text-accent-blue">{tool.clicks} clicks</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Categories Distribution */}
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                        {renderIcon('folder', 18)} Tools by Category
                    </h3>
                    <div className="space-y-2">
                        {categories.slice(0, 6).map((cat: Category) => {
                            const count = tools.filter((t: AdminTool) => (t.categoryName || []).includes(cat.categoryName)).length;
                            const percentage = tools.length > 0 ? (count / tools.length) * 100 : 0;
                            return (
                                <div key={cat.id} className="flex items-center gap-3">
                                    <span className="text-sm text-text-secondary w-24 truncate">{cat.categoryName}</span>
                                    <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-accent-blue rounded-full" style={{ width: `${percentage}%` }} />
                                    </div>
                                    <span className="text-xs text-text-tertiary w-8">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tasks Distribution */}
                <div className="bg-bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                        {renderIcon('target', 18)} Tools by Task
                    </h3>
                    <div className="space-y-2">
                        {tasks.slice(0, 6).map((task: Task) => {
                            const count = tools.filter((t: AdminTool) => (t.taskName || []).includes(task.taskName)).length;
                            const percentage = tools.length > 0 ? (count / tools.length) * 100 : 0;
                            return (
                                <div key={task.id} className="flex items-center gap-3">
                                    <span className="text-sm text-text-secondary w-24 truncate">{task.taskName}</span>
                                    <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-accent-green rounded-full" style={{ width: `${percentage}%` }} />
                                    </div>
                                    <span className="text-xs text-text-tertiary w-8">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
