-- Schema for `tools` related entities
-- Auto-generated from schema.sql

-- Name: tools; Type: TABLE; Schema: public; Owner: postgres
--
--

CREATE TABLE public.tools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    app_username text NOT NULL,
    summary text,
    description text,
    tags text[],
    pricing text DEFAULT 'freemium'::text,
    pricing_label text,
    pricing_tiers jsonb,
    has_free_trial boolean DEFAULT false,
    free_trial_days integer,
    discount text,
    billing_frequency text,
    website_url text,
    affiliate_url text,
    affiliate_enabled boolean DEFAULT false,
    logo_url text,
    images text[],
    videos text[],
    core_features text[],
    use_cases text[],
    pros text[],
    cons text[],
    faq jsonb,
    version_history jsonb,
    alternative_tools text[],
    tool_references text[],
    contact_name text,
    contact_email text,
    contact_company text,
    contact_address text,
    contact_mobile text,
    social_links jsonb,
    internal_notes jsonb,
    save_count integer DEFAULT 0,
    launched_on date,
    is_featured boolean DEFAULT false,
    show_pricing boolean DEFAULT true,
    status text DEFAULT 'draft'::text,
    scheduled_at timestamp without time zone,
    spotlight_enabled boolean DEFAULT false,
    spotlight_position integer,
    spotlight_start_date timestamp without time zone,
    spotlight_end_date timestamp without time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    play_store_url text,
    app_store_url text,
    category_name text[],
    task_name text[],
    back_links boolean DEFAULT false,
    view_count integer DEFAULT 0,
    upvotes integer DEFAULT 0,
    downvotes integer DEFAULT 0,
    trending_position integer DEFAULT 0,
    rating numeric(2,1) DEFAULT NULL::numeric,
    listing_type text DEFAULT 'free'::text,
    search_vector tsvector,
    is_ai_generated boolean DEFAULT false,
    is_reposted boolean DEFAULT false,
    CONSTRAINT chk_rating_range CHECK (((rating IS NULL) OR ((rating >= (0)::numeric) AND (rating <= (5)::numeric))))
);


ALTER TABLE public.tools OWNER TO postgres;

-- Name: search_tools(text, text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
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

-- Name: search_tools_count(text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
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

-- Name: tools_search_vector_update(); Type: FUNCTION; Schema: public; Owner: postgres
--
--

CREATE FUNCTION public.tools_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$

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

$$;


ALTER FUNCTION public.tools_search_vector_update() OWNER TO postgres;

-- Name: update_votes(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--
--

CREATE FUNCTION public.update_votes(p_tool_id uuid, p_action text, p_vote_type text, p_previous_vote text DEFAULT NULL::text) RETURNS TABLE(upvotes integer, downvotes integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$

BEGIN

  -- Validate inputs

  IF p_action NOT IN ('add', 'remove', 'change') THEN

    RAISE EXCEPTION 'Invalid p_action: %. Must be add, remove, or change.', p_action;

  END IF;

  IF p_vote_type NOT IN ('up', 'down') THEN

    RAISE EXCEPTION 'Invalid p_vote_type: %. Must be up or down.', p_vote_type;

  END IF;

  IF p_action = 'change' AND (p_previous_vote IS NULL OR p_previous_vote NOT IN ('up', 'down')) THEN

    RAISE EXCEPTION 'Invalid p_previous_vote: %. Must be up or down when action is change.', p_previous_vote;

  END IF;



  IF p_action = 'add' THEN

    IF p_vote_type = 'up' THEN

      UPDATE public.tools SET upvotes = GREATEST(0, COALESCE(public.tools.upvotes, 0) + 1) WHERE id = p_tool_id;

    ELSE

      UPDATE public.tools SET downvotes = GREATEST(0, COALESCE(public.tools.downvotes, 0) + 1) WHERE id = p_tool_id;

    END IF;



  ELSIF p_action = 'remove' THEN

    IF p_vote_type = 'up' THEN

      UPDATE public.tools SET upvotes = GREATEST(0, COALESCE(public.tools.upvotes, 0) - 1) WHERE id = p_tool_id;

    ELSE

      UPDATE public.tools SET downvotes = GREATEST(0, COALESCE(public.tools.downvotes, 0) - 1) WHERE id = p_tool_id;

    END IF;



  ELSIF p_action = 'change' THEN

    IF p_vote_type = p_previous_vote THEN

      RAISE EXCEPTION 'change action requires different p_vote_type and p_previous_vote, got both = %', p_vote_type;

    END IF;

    IF p_previous_vote = 'up' THEN

      UPDATE public.tools SET

        upvotes = GREATEST(0, COALESCE(public.tools.upvotes, 0) - 1),

        downvotes = GREATEST(0, COALESCE(public.tools.downvotes, 0) + 1)

      WHERE id = p_tool_id;

    ELSIF p_previous_vote = 'down' THEN

      UPDATE public.tools SET

        upvotes = GREATEST(0, COALESCE(public.tools.upvotes, 0) + 1),

        downvotes = GREATEST(0, COALESCE(public.tools.downvotes, 0) - 1)

      WHERE id = p_tool_id;

    END IF;

  END IF;



  IF NOT FOUND THEN

    RAISE EXCEPTION 'Tool with id % not found.', p_tool_id;

  END IF;



  RETURN QUERY SELECT public.tools.upvotes, public.tools.downvotes FROM public.tools WHERE id = p_tool_id;

END;

$$;


ALTER FUNCTION public.update_votes(p_tool_id uuid, p_action text, p_vote_type text, p_previous_vote text) OWNER TO postgres;

-- Name: tools tools_app_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_app_username_key UNIQUE (app_username);

-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY (id);

-- Name: idx_tools_app_username; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_app_username ON public.tools USING btree (app_username);

-- Name: idx_tools_category_name_gin; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_category_name_gin ON public.tools USING gin (category_name);

-- Name: idx_tools_created_at; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_created_at ON public.tools USING btree (created_at DESC);

-- Name: idx_tools_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_name_trgm ON public.tools USING gin (name extensions.gin_trgm_ops);

-- Name: idx_tools_rating; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_rating ON public.tools USING btree (rating DESC NULLS LAST);

-- Name: idx_tools_save_count; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_save_count ON public.tools USING btree (save_count DESC);

-- Name: idx_tools_search_vector; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_search_vector ON public.tools USING gin (search_vector);

-- Name: idx_tools_spotlight_position; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_spotlight_position ON public.tools USING btree (spotlight_position);

-- Name: idx_tools_status; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_status ON public.tools USING btree (status);

-- Name: idx_tools_status_created_at; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_status_created_at ON public.tools USING btree (status, created_at DESC);

-- Name: idx_tools_status_save_count; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_status_save_count ON public.tools USING btree (status, save_count DESC);

-- Name: idx_tools_status_spotlight; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_status_spotlight ON public.tools USING btree (status, spotlight_enabled, spotlight_position);

-- Name: idx_tools_status_trending; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_status_trending ON public.tools USING btree (status, trending_position);

-- Name: idx_tools_tags_gin; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_tags_gin ON public.tools USING gin (tags);

-- Name: idx_tools_task_name_gin; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_task_name_gin ON public.tools USING gin (task_name);

-- Name: idx_tools_trending_position; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tools_trending_position ON public.tools USING btree (trending_position);

-- Name: tools_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX tools_created_at_idx ON public.tools USING btree (created_at);

-- Name: tools trg_tools_search_vector; Type: TRIGGER; Schema: public; Owner: postgres
--
--

CREATE TRIGGER trg_tools_search_vector BEFORE INSERT OR UPDATE ON public.tools FOR EACH ROW EXECUTE FUNCTION public.tools_search_vector_update();

-- Name: tools anon_read_published_tools; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY anon_read_published_tools ON public.tools FOR SELECT USING ((status = 'published'::text));

-- Name: tools; Type: ROW SECURITY; Schema: public; Owner: postgres
--
--

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Name: TABLE tools; Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON TABLE public.tools TO anon;
GRANT ALL ON TABLE public.tools TO authenticated;
GRANT ALL ON TABLE public.tools TO service_role;

-- Name: FUNCTION search_tools(search_query text, filter_category text, filter_task text, filter_pricing text, result_limit integer, result_offset integer); Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON FUNCTION public.search_tools(search_query text, filter_category text, filter_task text, filter_pricing text, result_limit integer, result_offset integer) TO anon;
GRANT ALL ON FUNCTION public.search_tools(search_query text, filter_category text, filter_task text, filter_pricing text, result_limit integer, result_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.search_tools(search_query text, filter_category text, filter_task text, filter_pricing text, result_limit integer, result_offset integer) TO service_role;

-- Name: FUNCTION search_tools_count(search_query text, filter_category text, filter_task text, filter_pricing text); Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON FUNCTION public.search_tools_count(search_query text, filter_category text, filter_task text, filter_pricing text) TO anon;
GRANT ALL ON FUNCTION public.search_tools_count(search_query text, filter_category text, filter_task text, filter_pricing text) TO authenticated;
GRANT ALL ON FUNCTION public.search_tools_count(search_query text, filter_category text, filter_task text, filter_pricing text) TO service_role;

-- Name: FUNCTION tools_search_vector_update(); Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON FUNCTION public.tools_search_vector_update() TO anon;
GRANT ALL ON FUNCTION public.tools_search_vector_update() TO authenticated;
GRANT ALL ON FUNCTION public.tools_search_vector_update() TO service_role;
