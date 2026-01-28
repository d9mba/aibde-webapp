/**
 * Server-Side Data Fetching
 * 
 * These functions fetch data directly from Supabase for Server Components.
 * Used by public pages that need to display data without API calls.
 * 
 * NOTE: This file now re-exports from split modules in ./data/
 * For the actual implementations, see:
 * - ./data/counts.ts - Count queries
 * - ./data/categories.ts - Category and task queries
 * - ./data/tools.ts - Tool fetching functions
 * - ./data/related.ts - Related and suggested tools
 * - ./data/search.ts - Search functions
 */

export * from './data/index';
