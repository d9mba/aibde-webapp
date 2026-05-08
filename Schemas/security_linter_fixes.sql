-- Supabase Security Linter Fixes
-- Run this script in your Supabase SQL Editor to resolve all security warnings.

-- 1. Fix "function_search_path_mutable" for update_modified_column
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 2. Fix "anon_security_definer_function_executable" & "authenticated_security_definer_function_executable"
-- Revoke public execution from the auto-enable event trigger function
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- 3. Fix "anon_security_definer_function_executable" & "authenticated_security_definer_function_executable"
-- Revoke public execution from the voting RPC (now handled securely server-side)
REVOKE EXECUTE ON FUNCTION public.update_votes(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_votes(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_votes(uuid, text, text, text) FROM authenticated;
