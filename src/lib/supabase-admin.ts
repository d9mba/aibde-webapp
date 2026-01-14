/**
 * Server-only Supabase Admin Client
 * 
 * Uses service role key to bypass RLS for admin operations.
 * This file should ONLY be imported in server-side code (API routes).
 */

import 'server-only'; // This will error if imported in client code

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Server-side Supabase Admin client
// Uses service role key to bypass RLS, or falls back to anon key
export const supabaseAdmin: SupabaseClient = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
    : createClient(supabaseUrl, supabaseAnonKey);
