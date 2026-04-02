-- Supabase Function: search_tools
-- Auto-generated from schema.sql

-- Name: search_tools(text, text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--
--
--

CREATE FUNCTION public.search_tools(search_query text DEFAULT NULL::text, filter_category text DEFAULT NULL::text, filter_task text DEFAULT NULL::text, filter_pricing text DEFAULT NULL::text, result_limit integer DEFAULT 100, result_offset integer DEFAULT 0) RETURNS SETOF public.tools
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public', 'extensions'
    AS $_$

DECLARE

    tsq tsquery;

    cleaned text;

BEGIN

    IF result_limit > 200 THEN result_limit := 200; END IF;

    IF result_limit < 1 THEN result_limit := 1; END IF;

    IF result_offset < 0 THEN result_offset := 0; END IF;



    cleaned := trim(coalesce(search_query, ''));



    IF cleaned <> '' THEN

        DECLARE pq_text text;

        BEGIN

            pq_text := plainto_tsquery('english', cleaned)::text;

            IF pq_text <> '' THEN

                tsq := to_tsquery('english',

                    regexp_replace(pq_text, '''$', ''':*')

                );

            END IF;

        END;

    END IF;



    IF cleaned <> '' THEN

        -- Combined: FTS matches + trigram name matches in one query

        -- Escape ILIKE wildcards in user input to prevent unintended pattern matching

        DECLARE escaped_cleaned text;

        BEGIN

            escaped_cleaned := replace(replace(replace(cleaned, '\', '\\'), '%', '\%'), '_', '\_');

        RETURN QUERY

        SELECT t.*

        FROM public.tools t

        WHERE t.status IN ('published', 'approved')

          AND (

              (tsq IS NOT NULL AND t.search_vector @@ tsq)

              OR similarity(t.name, cleaned) > 0.15

              OR t.name ILIKE '%' || escaped_cleaned || '%' ESCAPE '\'

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

        END;

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

$_$;


ALTER FUNCTION public.search_tools(search_query text, filter_category text, filter_task text, filter_pricing text, result_limit integer, result_offset integer) OWNER TO postgres;
