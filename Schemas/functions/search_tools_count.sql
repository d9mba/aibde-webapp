-- Supabase Function: search_tools_count
-- Auto-generated from schema.sql

-- Name: search_tools_count(text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--
--
--

CREATE FUNCTION public.search_tools_count(search_query text DEFAULT NULL::text, filter_category text DEFAULT NULL::text, filter_task text DEFAULT NULL::text, filter_pricing text DEFAULT NULL::text) RETURNS bigint
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public', 'extensions'
    AS $_$

DECLARE

    tsq tsquery;

    cleaned text;

    total bigint;

BEGIN

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

        -- Escape ILIKE wildcards

        DECLARE escaped_cleaned text;

        BEGIN

            escaped_cleaned := replace(replace(replace(cleaned, '\', '\\'), '%', '\%'), '_', '\_');

        SELECT count(*) INTO total

        FROM public.tools t

        WHERE t.status IN ('published', 'approved')

          AND (

              (tsq IS NOT NULL AND t.search_vector @@ tsq)

              OR similarity(t.name, cleaned) > 0.15

              OR t.name ILIKE '%' || escaped_cleaned || '%' ESCAPE '\'

          )

          AND (filter_category IS NULL OR t.category_name @> ARRAY[filter_category])

          AND (filter_task IS NULL OR t.task_name @> ARRAY[filter_task])

          AND (filter_pricing IS NULL OR t.pricing = filter_pricing);

        END;

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

$_$;


ALTER FUNCTION public.search_tools_count(search_query text, filter_category text, filter_task text, filter_pricing text) OWNER TO postgres;
