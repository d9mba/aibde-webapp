'use client';

import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/components/ui';

export default function SettingsPage() {
    const { settings, updateSettings } = useAdmin();
    const { showToast, updateToast } = useToast();

    const handleChange = async (key: keyof typeof settings, value: unknown) => {
        const toastId = showToast('Saving settings...', 'loading');
        try {
            await updateSettings({ [key]: value });
            updateToast(toastId, 'Settings saved!', 'success');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save settings';
            updateToast(toastId, message, 'error');
        }
    };

    const Toggle = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) => (
        <div className="flex items-center justify-between gap-3 py-3 sm:py-4 border-b border-border">
            <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary text-sm sm:text-base">{label}</div>
                {description && <div className="text-[10px] sm:text-xs text-text-tertiary mt-0.5">{description}</div>}
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <div className="w-10 sm:w-11 h-5 sm:h-6 bg-bg-tertiary rounded-full peer peer-checked:bg-accent-primary transition-colors">
                    <div className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
                </div>
            </label>
        </div>
    );

    return (
        <div className="min-h-screen p-3 sm:p-6 bg-bg-primary">
            <div className="max-w-[800px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Page Settings</h1>
                        <p className="text-xs sm:text-sm text-text-tertiary mt-0.5 sm:mt-1">Configure homepage layout and sections</p>
                    </div>
                </div>

                {/* Homepage Display */}
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden mb-4 sm:mb-6">
                    <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border">
                        <h2 className="text-sm sm:text-base font-semibold text-text-primary">Homepage Sections</h2>
                    </div>
                    <div className="px-3 sm:px-5">
                        <div className="py-3 sm:py-4 border-b border-border">
                            <label className="block font-medium text-text-primary text-sm sm:text-base mb-2">Spotlight Count</label>
                            <select
                                value={settings.spotlightCount}
                                onChange={(e) => handleChange('spotlightCount', parseInt(e.target.value))}
                                className="px-3 py-2 text-sm bg-bg-primary border border-border rounded-lg text-text-primary w-full sm:w-auto"
                            >
                                <option value={4}>4 tools</option>
                                <option value={6}>6 tools</option>
                                <option value={8}>8 tools (default)</option>
                                <option value={12}>12 tools</option>
                            </select>
                            <p className="text-[10px] sm:text-xs text-text-tertiary mt-1">Number of featured tools to show in Spotlight section</p>
                        </div>

                        <Toggle
                            label="Show Spotlight Section"
                            description="Display the featured tools spotlight on homepage"
                            checked={settings.showSpotlightOnHome}
                            onChange={(v) => handleChange('showSpotlightOnHome', v)}
                        />

                        <Toggle
                            label="Show Categories Section"
                            description="Display category links on homepage"
                            checked={settings.showCategoriesOnHome}
                            onChange={(v) => handleChange('showCategoriesOnHome', v)}
                        />

                        <Toggle
                            label="Show Tasks Section"
                            description="Display task links on homepage"
                            checked={settings.showTasksOnHome ?? true}
                            onChange={(v) => handleChange('showTasksOnHome', v)}
                        />

                        <Toggle
                            label="Show Top 10 per Category"
                            description="Display top 10 tools for each category on homepage"
                            checked={settings.showTop10OnHome ?? false}
                            onChange={(v) => handleChange('showTop10OnHome', v)}
                        />
                    </div>
                </div>

                {/* Tool Detail Page Settings */}
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden mb-4 sm:mb-6">
                    <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border">
                        <h2 className="text-sm sm:text-base font-semibold text-text-primary">Tool Detail Page</h2>
                    </div>
                    <div className="px-3 sm:px-5">
                        <Toggle
                            label="Show Featured Alternatives"
                            description="Display featured alternatives sidebar on tool detail pages"
                            checked={settings.showFeaturedAlternatives ?? true}
                            onChange={(v) => handleChange('showFeaturedAlternatives', v)}
                        />
                    </div>
                </div>

                {/* Analytics */}
                <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border">
                        <h2 className="text-sm sm:text-base font-semibold text-text-primary">Analytics</h2>
                    </div>
                    <div className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="p-3 sm:p-4 bg-accent-primary-bg border border-accent-primary/20 rounded-lg">
                            <p className="text-sm text-text-primary font-medium">PostHog Integration</p>
                            <p className="text-[10px] sm:text-xs text-text-secondary mt-1">
                                Analytics will be tracked automatically once PostHog is configured.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
