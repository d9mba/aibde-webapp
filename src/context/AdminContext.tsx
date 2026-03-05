'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AITool, AdminTool, Category, Task, Tag, Note } from '@/types';
import { supabase, dbToolToAdminTool } from '@/lib/supabase';

// Re-export types for convenience
export type { AITool, AdminTool, Category, Task, Tag, Note };

// Admin settings - extends the base settings
export interface AdminSettings {
    spotlightCount: number;
    showSpotlightOnHome: boolean;
    showCategoriesOnHome: boolean;
    showTasksOnHome: boolean;
    showTop10OnHome: boolean;
    showFeaturedAlternatives: boolean;
}

const defaultSettings: AdminSettings = {
    spotlightCount: 8,
    showSpotlightOnHome: true,
    showCategoriesOnHome: true,
    showTasksOnHome: true,
    showTop10OnHome: false,
    showFeaturedAlternatives: true,
};

interface AdminState {
    settings: AdminSettings;
}

interface AdminContextType extends AdminState {
    isLoaded: boolean;
    isLoading: boolean;

    // Mutation counter — increments on every tool add/update/delete
    // Pages that display tools should watch this value and refetch
    toolsMutated: number;

    // Tool operations
    addTool: (tool: Omit<AdminTool, 'id'>) => Promise<AdminTool | null>;
    updateTool: (id: string, updates: Partial<AdminTool>) => Promise<void>;
    deleteTool: (id: string) => Promise<void>;

    // Category operations
    addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    // Task operations
    addTask: (task: Omit<Task, 'id'>) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    // Tag operations
    addTag: (tag: Omit<Tag, 'id'>) => Promise<void>;
    updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
    deleteTag: (id: string) => Promise<void>;

    // Note operations
    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note | null>;
    updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;

    // Settings
    updateSettings: (updates: Partial<AdminSettings>) => Promise<void>;

    // Utility
    refreshData: () => Promise<void>;
    exportData: () => string;
    importData: (json: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Check if we're using the API backend
const USE_API = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-project-url';

// localStorage key for fallback
const STORAGE_KEY = 'aibde_admin_data';

interface AdminProviderProps {
    children: ReactNode;
    initialTools?: AdminTool[];
}

export function AdminProvider({ children, initialTools }: AdminProviderProps) {
    const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [toolsMutated, setToolsMutated] = useState(0);

    // Fetch data from API
    const fetchFromAPI = useCallback(async () => {
        if (!USE_API) return null;

        try {
            // ONLY fetch settings on initial load.
            // Categories, Tasks, Tags, and Notes are fetched directly by the pages that need them.
            const results = await Promise.allSettled([
                fetch('/api/settings'),
            ]);

            // Helper to safely extract data from settled promises
            async function extractData<T>(
                result: PromiseSettledResult<Response>,
                fallback: T
            ): Promise<T> {
                if (result.status === 'fulfilled' && result.value.ok) {
                    try {
                        return await result.value.json();
                    } catch {
                        console.warn('[AdminContext] Failed to parse JSON response');
                        return fallback;
                    }
                }
                if (result.status === 'rejected') {
                    console.warn('[AdminContext] Request failed:', result.reason);
                }
                return fallback;
            }

            const [apiSettings] = await Promise.all([
                extractData(results[0], defaultSettings),
            ]);

            return {
                settings: apiSettings && !(apiSettings as { error?: boolean }).error ? apiSettings : defaultSettings,
            };
        } catch (error) {
            console.error('Failed to fetch from API:', error);
            return null;
        }
    }, []);

    // Use pathname hook to detect navigation changes
    const pathname = usePathname();

    // OPTIMIZATION: Single flag to track if data has been fetched
    const [dataFetched, setDataFetched] = useState(false);

    // Unified data loading effect - only fetches once per session
    // Uses deduplication to prevent multiple requests

    useEffect(() => {
        // Only dashboard pages need full client-side data fetching (includes notes, drafts, etc.)
        const needsFullData = pathname?.startsWith('/dashboard');

        // Skip client-side data fetching on SSR pages
        if (!needsFullData) {
            setIsLoaded(true);
            setIsLoading(false);
            return;
        }

        // OPTIMIZATION: Skip if already fetched
        // The check for categories.length > 0 is removed as categories are no longer in central state
        if (dataFetched) {
            setIsLoaded(true);
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);

            // Dashboard pages use authenticated API (includes notes, all tools including drafts)
            if (USE_API) {
                const apiData = await fetchFromAPI();
                if (apiData) {
                    setSettings(apiData.settings);
                    setDataFetched(true); // Mark as fetched
                    setIsLoaded(true);
                    setIsLoading(false);
                    return;
                }
            }

            // Fallback to localStorage
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setSettings(parsed.settings || defaultSettings);
                } catch {
                    // Fallback to empty state
                    setSettings(defaultSettings);
                }
            } else {
                // No cached data - start with empty state
                setSettings(defaultSettings);
            }

            setDataFetched(true); // Mark as fetched
            setIsLoaded(true);
            setIsLoading(false);
        };

        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchFromAPI, pathname, dataFetched]);
    // Refresh data from API
    const refreshData = async () => {
        if (!USE_API) return;
        setIsLoading(true);
        const apiData = await fetchFromAPI();
        if (apiData) {
            setSettings(apiData.settings);
        }
        setIsLoading(false);
    };

    // Tool operations
    const addTool = async (tool: Omit<AdminTool, 'id'>): Promise<AdminTool | null> => {
        if (USE_API) {
            const res = await fetch('/api/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tool),
            });
            const newTool = await res.json();
            if (!res.ok) throw new Error(newTool.error || 'Failed to add tool');
            setToolsMutated(c => c + 1);
            return newTool;
        } else {
            const newTool: AdminTool = {
                ...tool,
                id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setToolsMutated(c => c + 1);
            return newTool;
        }
    };

    const updateTool = async (id: string, updates: Partial<AdminTool>) => {
        if (USE_API) {
            const res = await fetch(`/api/tools/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const updatedTool = await res.json();
            if (!res.ok) {
                // Handle missing fields validation (when publishing)
                if (updatedTool.missingFields) {
                    throw new Error(`Cannot publish: Missing required fields - ${updatedTool.missingFields.join(', ')}`);
                }
                // Extract detailed validation errors if available
                let errorMessage = updatedTool.error || 'Failed to update tool';
                if (updatedTool.details?.fieldErrors) {
                    const fields = Object.entries(updatedTool.details.fieldErrors)
                        .map(([field, errors]: [string, any]) => `${field}: ${errors.join(', ')}`)
                        .join('; ');
                    errorMessage = `Validation failed: ${fields}`;
                }
                throw new Error(errorMessage);
            }
            setToolsMutated(c => c + 1);
        } else {
            console.warn('[AdminContext] updateTool is a no-op in non-API mode');
            setToolsMutated(c => c + 1);
        }
    };

    const deleteTool = async (id: string) => {
        if (USE_API) {
            const res = await fetch(`/api/tools/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete tool');
            }
            setToolsMutated(c => c + 1);
        } else {
            console.warn('[AdminContext] deleteTool is a no-op in non-API mode');
            setToolsMutated(c => c + 1);
        }
    };



    // Category operations
    const addCategory = async (category: Omit<Category, 'id'>) => {
        if (USE_API) {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(category),
            });
            const newCategory = await res.json();
            if (!res.ok) throw new Error(newCategory.error || 'Failed to add category');
            // Let pages handle refetch via SWR
        } else {
            // Fallback removed
        }
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        if (USE_API) {
            const res = await fetch('/api/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates }),
            });
            const updatedCategory = await res.json();
            if (!res.ok) throw new Error(updatedCategory.error || 'Failed to update category');
            // Pages refetch via SWR
        } else {
            // Fallback removed
        }
    };

    const deleteCategory = async (id: string) => {
        if (USE_API) {
            const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete category');
            }
            // Pages refetch via SWR
        } else {
            // Fallback removed
        }
    };

    // Task operations
    const addTask = async (task: Omit<Task, 'id'>) => {
        if (USE_API) {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task),
            });
            const newTask = await res.json();
            if (!res.ok) throw new Error(newTask.error || 'Failed to add task');
            // Let pages handle refetch via SWR
        } else {
            // Fallback removed
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        if (USE_API) {
            const res = await fetch('/api/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates }),
            });
            const updatedTask = await res.json();
            if (!res.ok) throw new Error(updatedTask.error || 'Failed to update task');
            // Pages refetch via SWR
        } else {
            // Fallback removed
        }
    };

    const deleteTask = async (id: string) => {
        if (USE_API) {
            const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete task');
            }
            // Pages refetch via SWR
        } else {
            // Fallback removed
        }
    };

    // Tag operations
    const addTag = async (tag: Omit<Tag, 'id'>) => {
        if (USE_API) {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tag),
            });
            const newTag = await res.json();
            if (!res.ok) throw new Error(newTag.error || 'Failed to add tag');
            // Pages refetch via SWR
        } else {
            // Fallback removed
        }
    };

    const updateTag = async (id: string, updates: Partial<Tag>) => {
        if (USE_API) {
            const res = await fetch('/api/tags', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates }),
            });
            const updatedTag = await res.json();
            if (!res.ok) throw new Error(updatedTag.error || 'Failed to update tag');
            // Pages refetch via SWR
        } else {
            // Fallback removed
        }
    };

    const deleteTag = async (id: string) => {
        if (USE_API) {
            const res = await fetch(`/api/tags?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete tag');
            }
            // Pages refetch via SWR
        } else {
            // Fallback removed
        }
    };

    // Note operations
    const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (USE_API) {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(note),
            });
            const newNote = await res.json();
            if (!res.ok) throw new Error(newNote.error || 'Failed to add note');
            return newNote;
        } else {
            const newNote: Note = {
                ...note,
                id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return newNote;
        }
    };

    const updateNote = async (id: string, updates: Partial<Note>) => {
        if (USE_API) {
            const res = await fetch('/api/notes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates }),
            });
            const updatedNote = await res.json();
            if (!res.ok) throw new Error(updatedNote.error || 'Failed to update note');
            // Pages fetch notes via SWR
        } else {
            // Fallback
        }
    };

    const deleteNote = async (id: string) => {
        if (USE_API) {
            const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete note');
            }
            // Let pages handle refresh via SWR
        } else {
            // Fallback
        }
    };

    const updateSettings = async (updates: Partial<AdminSettings>) => {
        if (USE_API) {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to update settings');
            // Merge response with existing settings to ensure all fields are present
            setSettings((prev) => ({ ...prev, ...result }));
        } else {
            setSettings((prev) => ({ ...prev, ...updates }));
        }
    };

    // getAutoAlternatives removed — use server-side API instead

    // Export/Import
    const exportData = () => JSON.stringify({ settings }, null, 2);

    const importData = (json: string) => {
        try {
            const parsed = JSON.parse(json);
            if (parsed.settings) setSettings(parsed.settings);
        } catch (e) {
            console.error('Failed to import data:', e);
        }
    };

    return (
        <AdminContext.Provider
            value={{
                settings: settings,
                isLoaded,
                isLoading,
                toolsMutated,
                addTool,
                updateTool,
                deleteTool,
                addCategory,
                updateCategory,
                deleteCategory,
                addTask,
                updateTask,
                deleteTask,
                addTag,
                updateTag,
                deleteTag,
                addNote,
                updateNote,
                deleteNote,
                updateSettings,
                refreshData,
                exportData,
                importData,
            }}
        >
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within AdminProvider');
    }
    return context;
}

// Hook for public pages - returns undefined if not loaded yet
export function useAdminData() {
    const context = useContext(AdminContext);
    return context;
}
