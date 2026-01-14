/**
 * Supabase Client with Clerk JWT Token
 * 
 * Creates a Supabase client that uses the Clerk JWT for authentication.
 * This allows RLS policies to verify the user's identity and role.
 */

import 'server-only';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Creates a Supabase client with Clerk JWT authentication
 * Use this for authenticated operations that need to pass RLS checks
 * 
 * @example
 * const supabase = await createAuthenticatedSupabaseClient();
 * const { data } = await supabase.from('tools').insert([...]);
 */
export async function createAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
    const { getToken } = await auth();

    // Get Clerk JWT token with Supabase template
    // You need to create a "supabase" JWT template in Clerk Dashboard
    const supabaseAccessToken = await getToken({ template: 'supabase' });

    if (!supabaseAccessToken) {
        throw new Error('No Supabase token available - user may not be authenticated');
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${supabaseAccessToken}`,
            },
        },
    });
}

/**
 * Creates a regular Supabase client (no auth, respects RLS)
 * Use this for public read operations
 */
export function createPublicSupabaseClient(): SupabaseClient {
    return createClient(supabaseUrl, supabaseAnonKey);
}
