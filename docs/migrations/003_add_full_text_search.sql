-- Migration: Add Full Text Search (tsvector) to tools table
-- Description:
--   1. Adds a 'search_vector' tsvector column with weighted fields
--   2. Creates a GIN index for fast full text lookups
--   3. Adds a trigger to auto-update the vector on INSERT/UPDATE
--   4. Backfills existing rows
--   5. Creates RPC functions: search_tools() and search_tools_count()
-- Run this in Supabase SQL Editor

-- =============================================================================
-- Step 1: Add the tsvector column
-- =============================================================================
ALTER TABLE public.tools
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- =============================================================================
-- Step 2: Create the trigger function to build the weighted search vector
--
-- Weight mapping:
--   A (highest) = name          — exact tool name matches rank first
--   B           = summary, categories, tasks — structured metadata
--   C           = tags          — user-defined labels
--   D (lowest)  = description   — long-form content (avoids keyword flooding)
-- =============================================================================
CREATE OR REPLACE FUNCTION tools_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.category_name, ' '), '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.task_name, ' '), '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- =============================================================================
-- Step 3: Attach the trigger (runs on every INSERT or UPDATE)
-- =============================================================================
DROP TRIGGER IF EXISTS trg_tools_search_vector ON public.tools;
CREATE TRIGGER trg_tools_search_vector
    BEFORE INSERT OR UPDATE ON public.tools
    FOR EACH ROW
    EXECUTE FUNCTION tools_search_vector_update();

-- =============================================================================
-- Step 4: Create GIN index for fast full text lookups
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tools_search_vector
    ON public.tools USING gin (search_vector);

-- =============================================================================
-- Step 5: Backfill search_vector for all existing rows
-- =============================================================================
UPDATE public.tools SET
    search_vector =
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(category_name, ' '), '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(task_name, ' '), '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'D');

-- =============================================================================
-- Step 6: RPC function — search_tools (Optimized for Type-ahead)
--
-- Uses prefix matching (:*) so partial words work during type-ahead.
-- Example: "vid" -> matches "video", "video editor", etc.
-- No ILIKE fallback — keeps the GIN index effective at all times.
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
    -- 1. Cap limit
    IF result_limit > 200 THEN result_limit := 200; END IF;

    -- 2. Clean input
    cleaned := trim(coalesce(search_query, ''));

    -- 3. Build tsquery with prefix matching on the last term
    -- "video edi" -> plainto_tsquery gives "'video' & 'edi'"
    -- regexp_replace turns it into "'video' & 'edi':*" (prefix match on last word)
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
      -- Fast vector match (GIN index used, no ILIKE fallback)
      AND (
          cleaned = ''
          OR (tsq IS NOT NULL AND t.search_vector @@ tsq)
      )
      -- Optional filters (array containment uses GIN index too)
      AND (filter_category IS NULL OR t.category_name @> ARRAY[filter_category])
      AND (filter_task IS NULL OR t.task_name @> ARRAY[filter_task])
      AND (filter_pricing IS NULL OR t.pricing = filter_pricing)
    ORDER BY
        -- Rank by FTS relevance when available
        CASE
            WHEN cleaned = '' THEN 0
            ELSE ts_rank_cd(t.search_vector, tsq, 32)
        END DESC,
        -- Popularity tiebreaker
        t.save_count DESC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;

-- =============================================================================
-- Step 7: RPC function — search_tools_count
--
-- Returns the total count of matching tools (for pagination).
-- Uses the same prefix-matching logic as search_tools.
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
-- Step 8: Grant access to the RPC functions via anon and authenticated roles
-- =============================================================================
GRANT EXECUTE ON FUNCTION search_tools TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_tools_count TO anon, authenticated;

-- =============================================================================
-- Verification: Test the search function
-- Uncomment and run these to verify:
-- =============================================================================
-- SELECT id, name, save_count FROM search_tools('video editor', NULL, NULL, NULL, 10, 0);
-- SELECT search_tools_count('video editor', NULL, NULL, NULL);
-- SELECT id, name FROM search_tools(NULL, 'Writing', NULL, NULL, 5, 0);
-- SELECT id, name FROM search_tools('free image', NULL, NULL, 'Free', 10, 0);
