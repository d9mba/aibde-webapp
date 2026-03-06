-- Migration: Fix Supabase Linter Warnings
-- Resolves:
--   1. search_tools() — mutable search_path (re-creates with SET search_path)
--   2. search_tools_count() — mutable search_path (re-creates with SET search_path)
--   3. pg_trgm extension in public schema (moves to extensions schema)
-- Run this in Supabase SQL Editor

-- =============================================================================
-- Step 1: Move pg_trgm from public to extensions schema
-- =============================================================================

-- Create the extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop the dependent trigram index first
DROP INDEX IF EXISTS public.idx_tools_name_trgm;

-- Drop from public, then re-create in extensions
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Re-create the trigram index (now using the extension from the extensions schema)
CREATE INDEX IF NOT EXISTS idx_tools_name_trgm
    ON public.tools USING gin (name extensions.gin_trgm_ops);

-- =============================================================================
-- Step 2: Re-create search_tools with SET search_path
-- =============================================================================
CREATE OR REPLACE FUNCTION search_tools(
    search_query text DEFAULT NULL,
    filter_category text DEFAULT NULL,
    filter_task text DEFAULT NULL,
    filter_pricing text DEFAULT NULL,
    result_limit int DEFAULT 100,
    result_offset int DEFAULT 0
)
RETURNS SETOF tools
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    tsq tsquery;
    cleaned text;
BEGIN
    IF result_limit > 200 THEN result_limit := 200; END IF;

    cleaned := trim(coalesce(search_query, ''));

    IF cleaned <> '' THEN
        tsq := to_tsquery('english',
            regexp_replace(
                plainto_tsquery('english', cleaned)::text,
                '''$', ''':*'
            )
        );
    END IF;

    RETURN QUERY
    SELECT t.*
    FROM public.tools t
    WHERE t.status IN ('published', 'approved')
      AND (
          cleaned = ''
          OR (tsq IS NOT NULL AND t.search_vector @@ tsq)
      )
      AND (filter_category IS NULL OR t.category_name @> ARRAY[filter_category])
      AND (filter_task IS NULL OR t.task_name @> ARRAY[filter_task])
      AND (filter_pricing IS NULL OR t.pricing = filter_pricing)
    ORDER BY
        CASE
            WHEN cleaned = '' THEN 0
            ELSE ts_rank_cd(t.search_vector, tsq, 32)
        END DESC,
        t.save_count DESC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;

-- =============================================================================
-- Step 3: Re-create search_tools_count with SET search_path
-- =============================================================================
CREATE OR REPLACE FUNCTION search_tools_count(
    search_query text DEFAULT NULL,
    filter_category text DEFAULT NULL,
    filter_task text DEFAULT NULL,
    filter_pricing text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    tsq tsquery;
    cleaned text;
    total bigint;
BEGIN
    cleaned := trim(coalesce(search_query, ''));

    IF cleaned <> '' THEN
        tsq := to_tsquery('english',
            regexp_replace(
                plainto_tsquery('english', cleaned)::text,
                '''$', ''':*'
            )
        );
    END IF;

    SELECT count(*) INTO total
    FROM public.tools t
    WHERE t.status IN ('published', 'approved')
      AND (
          cleaned = ''
          OR (tsq IS NOT NULL AND t.search_vector @@ tsq)
      )
      AND (filter_category IS NULL OR t.category_name @> ARRAY[filter_category])
      AND (filter_task IS NULL OR t.task_name @> ARRAY[filter_task])
      AND (filter_pricing IS NULL OR t.pricing = filter_pricing);

    RETURN total;
END;
$$;

-- =============================================================================
-- Step 4: Re-grant access
-- =============================================================================
GRANT EXECUTE ON FUNCTION search_tools TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_tools_count TO anon, authenticated;

-- =============================================================================
-- Verification: Run the linter again after applying this migration
-- to confirm all three warnings are resolved.
-- =============================================================================
