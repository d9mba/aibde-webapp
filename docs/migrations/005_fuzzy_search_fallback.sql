-- Migration: Fix Search Ranking — Combined FTS + Trigram + Business Priority
--
-- Ranking order:
--   1. Name accuracy (FTS relevance + trigram similarity)
--   2. Spotlight tools first
--   3. Featured tools next
--   4. Fast/verified/premium listings
--   5. Rest by save_count
--
-- Run this in Supabase SQL Editor

-- =============================================================================
-- Step 1: Update search_tools — combined FTS + trigram + business priority
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
SET search_path = public, extensions
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

    IF cleaned <> '' THEN
        -- Combined: FTS matches + trigram name matches in one query
        RETURN QUERY
        SELECT t.*
        FROM public.tools t
        WHERE t.status IN ('published', 'approved')
          AND (
              (tsq IS NOT NULL AND t.search_vector @@ tsq)
              OR similarity(t.name, cleaned) > 0.15
              OR t.name ILIKE '%' || cleaned || '%'
          )
          AND (filter_category IS NULL OR t.category_name @> ARRAY[filter_category])
          AND (filter_task IS NULL OR t.task_name @> ARRAY[filter_task])
          AND (filter_pricing IS NULL OR t.pricing = filter_pricing)
        ORDER BY
            -- 1. Relevance score (FTS boosted above trigram)
            CASE
                WHEN tsq IS NOT NULL AND t.search_vector @@ tsq
                    THEN ts_rank_cd(t.search_vector, tsq, 32) + 1.0
                ELSE similarity(t.name, cleaned)
            END DESC,
            -- 2. Spotlight tools first
            CASE WHEN t.spotlight_enabled = true THEN 0 ELSE 1 END,
            -- 3. Featured tools
            CASE WHEN t.is_featured = true THEN 0 ELSE 1 END,
            -- 4. Listing type priority (spotlight > featured > verified > fast > free)
            CASE t.listing_type
                WHEN 'spotlight' THEN 0
                WHEN 'featured' THEN 1
                WHEN 'verified' THEN 2
                WHEN 'fast' THEN 3
                ELSE 4
            END,
            -- 5. Popularity: impressions first, then saves
            t.view_count DESC,
            t.save_count DESC
        LIMIT result_limit
        OFFSET result_offset;
        RETURN;
    END IF;

    -- No query — browse mode (filters only, same priority order)
    RETURN QUERY
    SELECT t.*
    FROM public.tools t
    WHERE t.status IN ('published', 'approved')
      AND (filter_category IS NULL OR t.category_name @> ARRAY[filter_category])
      AND (filter_task IS NULL OR t.task_name @> ARRAY[filter_task])
      AND (filter_pricing IS NULL OR t.pricing = filter_pricing)
    ORDER BY
        CASE WHEN t.spotlight_enabled = true THEN 0 ELSE 1 END,
        CASE WHEN t.is_featured = true THEN 0 ELSE 1 END,
        CASE t.listing_type
            WHEN 'spotlight' THEN 0
            WHEN 'featured' THEN 1
            WHEN 'verified' THEN 2
            WHEN 'fast' THEN 3
            ELSE 4
        END,
        t.view_count DESC,
        t.save_count DESC
    LIMIT result_limit OFFSET result_offset;
END;
$$;

-- =============================================================================
-- Step 2: Update search_tools_count — same combined logic (no ordering needed)
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
SET search_path = public, extensions
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

    IF cleaned <> '' THEN
        SELECT count(*) INTO total
        FROM public.tools t
        WHERE t.status IN ('published', 'approved')
          AND (
              (tsq IS NOT NULL AND t.search_vector @@ tsq)
              OR similarity(t.name, cleaned) > 0.15
              OR t.name ILIKE '%' || cleaned || '%'
          )
          AND (filter_category IS NULL OR t.category_name @> ARRAY[filter_category])
          AND (filter_task IS NULL OR t.task_name @> ARRAY[filter_task])
          AND (filter_pricing IS NULL OR t.pricing = filter_pricing);
        RETURN total;
    END IF;

    SELECT count(*) INTO total
    FROM public.tools t
    WHERE t.status IN ('published', 'approved')
      AND (filter_category IS NULL OR t.category_name @> ARRAY[filter_category])
      AND (filter_task IS NULL OR t.task_name @> ARRAY[filter_task])
      AND (filter_pricing IS NULL OR t.pricing = filter_pricing);
    RETURN total;
END;
$$;

-- =============================================================================
-- Step 3: Re-grant access
-- =============================================================================
GRANT EXECUTE ON FUNCTION search_tools TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_tools_count TO anon, authenticated;
