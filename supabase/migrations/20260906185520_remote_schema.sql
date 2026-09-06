SET local check_function_bodies = off;

CREATE EXTENSION "hypopg" SCHEMA "extensions";

CREATE EXTENSION "index_advisor" SCHEMA "extensions";

CREATE EXTENSION "pg_trgm" SCHEMA "extensions";

CREATE TABLE "public"."blog_posts" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"            text                     NOT NULL,
  "slug"             text                     NOT NULL,
  "content"          text                     NOT NULL,
  "excerpt"          text,
  "category"         text,
  "tags"             text[],
  "related_tools"    text[],
  "faq"              jsonb,
  "status"           text                     DEFAULT 'draft'::text,
  "published_at"     timestamp with time zone,
  "created_at"       timestamp with time zone DEFAULT now(),
  "updated_at"       timestamp with time zone DEFAULT now(),
  "author_id"        uuid,
  "meta_title"       text,
  "meta_description" text,
  "focus_keywords"   text[],
  "cover_image"      text,
  "images"           text[],
  CONSTRAINT "blog_posts_pkey" PRIMARY KEY (id),
  CONSTRAINT "blog_posts_slug_key" UNIQUE (slug),
  CONSTRAINT "blog_posts_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);

ALTER TABLE "public"."blog_posts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."categories" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "category_name" text                     NOT NULL,
  "description"   text,
  "icon"          text,
  "count"         integer                  DEFAULT 0,
  "created_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "categories_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."categories"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."news_articles" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"              text                     NOT NULL,
  "slug"               text                     NOT NULL,
  "summary"            text,
  "content"            text                     NOT NULL,
  "category"           text                     DEFAULT 'all'::text,
  "thumbnail"          text,
  "sources"            jsonb                    DEFAULT '[]'::jsonb,
  "published_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "read_time_minutes"  smallint                 DEFAULT 1,
  "related_tool_slugs" text[]                   DEFAULT '{}'::text[],
  "tags"               text[]                   DEFAULT '{}'::text[],
  "hero_image"         text,
  "is_featured"        boolean                  NOT NULL DEFAULT false,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "news_articles_pkey" PRIMARY KEY (id),
  CONSTRAINT "news_articles_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."news_articles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."notes" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"      text                     NOT NULL,
  "content"    text,
  "tool_id"    uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "notes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."notes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."payments" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "submission_id"     uuid                     NOT NULL,
  "submitter_name"    text,
  "submitter_email"   text,
  "tool_name"         text,
  "tool_url"          text,
  "plan"              text,
  "product_id"        text,
  "payment_provider"  text,
  "payment_id"        text,
  "amount"            numeric,
  "currency"          text,
  "status"            text                     NOT NULL DEFAULT 'initiated'::text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone,
  "email_status"      text                     DEFAULT 'not_sent'::text,
  "email_sent_at"     timestamp with time zone,
  "email_provider_id" text,
  "failure_reason"    text,
  "tax"               numeric                  DEFAULT 0,
  "net_amount"        numeric                  DEFAULT 0,
  "invoice_url"       text,
  CONSTRAINT "payments_email_status_check" CHECK ((email_status = ANY (ARRAY['not_sent'::text, 'sent'::text, 'failed'::text]))),
  CONSTRAINT "payments_pkey" PRIMARY KEY (id),
  CONSTRAINT "payments_status_check" CHECK ((status = ANY (ARRAY['initiated'::text, 'success'::text, 'failed'::text])))
);

ALTER TABLE "public"."payments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."settings" (
  "id"                         integer                  NOT NULL DEFAULT 1,
  "spotlight_count"            integer                  DEFAULT 8,
  "show_spotlight_on_home"     boolean                  DEFAULT true,
  "show_categories_on_home"    boolean                  DEFAULT true,
  "show_tasks_on_home"         boolean                  DEFAULT true,
  "show_top10_on_home"         boolean                  DEFAULT false,
  "updated_at"                 timestamp with time zone DEFAULT now(),
  "show_featured_alternatives" boolean                  DEFAULT true,
  CONSTRAINT "settings_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."settings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tags" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "tag_name"   text                     NOT NULL,
  "count"      integer                  DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "tags_name_key" UNIQUE (tag_name),
  CONSTRAINT "tags_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."tags"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tasks" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "task_name"   text                     NOT NULL,
  "description" text,
  "icon"        text,
  "count"       integer                  DEFAULT 0,
  "created_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "tasks_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."tasks"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tool_submissions" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "tool_name"             text,
  "website_url"           text,
  "category"              text,
  "pricing_model"         text,
  "short_description"     text,
  "full_description"      text,
  "logo_url"              text,
  "submitter_name"        text,
  "submitter_email"       text,
  "plan_selected"         text,
  "review_status"         text                     DEFAULT 'pending'::text,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "payment_status"        text                     DEFAULT 'initiated'::text,
  "submission_ref"        text,
  "released_date"         text,
  "video_urls"            text,
  "screenshot_urls"       text,
  "tags"                  text,
  "key_features"          text,
  "has_affiliate_program" boolean                  DEFAULT false,
  "affiliate_url"         text,
  "social_links"          jsonb,
  "tool_id"               uuid,
  "app_username"          text,
  CONSTRAINT "tool_submissions_payment_status_check" CHECK ((payment_status = ANY (ARRAY['initiated'::text, 'success'::text, 'failed'::text]))),
  CONSTRAINT "tool_submissions_pkey" PRIMARY KEY (id),
  CONSTRAINT "tool_submissions_review_status_check"
    CHECK ((review_status = ANY (ARRAY['pending'::text, 'draft'::text, 'published'::text, 'unpublished'::text, 'scheduled'::text]))),
  CONSTRAINT "tool_submissions_submission_ref_key" UNIQUE (submission_ref)
);

ALTER TABLE "public"."tool_submissions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tools" (
  "id"                   uuid                        NOT NULL DEFAULT gen_random_uuid(),
  "name"                 text                        NOT NULL,
  "app_username"         text                        NOT NULL,
  "summary"              text,
  "description"          text,
  "tags"                 text[],
  "pricing"              text                        DEFAULT 'freemium'::text,
  "pricing_label"        text,
  "pricing_tiers"        jsonb,
  "has_free_trial"       boolean                     DEFAULT false,
  "free_trial_days"      integer,
  "discount"             text,
  "billing_frequency"    text,
  "website_url"          text,
  "affiliate_url"        text,
  "affiliate_enabled"    boolean                     DEFAULT false,
  "logo_url"             text,
  "images"               text[],
  "videos"               text[],
  "core_features"        text[],
  "use_cases"            text[],
  "pros"                 text[],
  "cons"                 text[],
  "faq"                  jsonb,
  "version_history"      jsonb,
  "alternative_tools"    text[],
  "tool_references"      text[],
  "contact_name"         text,
  "contact_email"        text,
  "contact_company"      text,
  "contact_address"      text,
  "contact_mobile"       text,
  "social_links"         jsonb,
  "internal_notes"       jsonb,
  "save_count"           integer                     DEFAULT 0,
  "launched_on"          date,
  "is_featured"          boolean                     DEFAULT false,
  "show_pricing"         boolean                     DEFAULT true,
  "status"               text                        DEFAULT 'draft'::text,
  "scheduled_at"         timestamp without time zone,
  "spotlight_enabled"    boolean                     DEFAULT false,
  "spotlight_position"   integer,
  "spotlight_start_date" timestamp without time zone,
  "spotlight_end_date"   timestamp without time zone,
  "created_at"           timestamp with time zone    DEFAULT now(),
  "updated_at"           timestamp with time zone    DEFAULT now(),
  "play_store_url"       text,
  "app_store_url"        text,
  "category_name"        text[],
  "task_name"            text[],
  "back_links"           boolean                     DEFAULT false,
  "view_count"           integer                     DEFAULT 0,
  "upvotes"              integer                     DEFAULT 0,
  "downvotes"            integer                     DEFAULT 0,
  "trending_position"    integer                     DEFAULT 0,
  "rating"               numeric(2,1)                DEFAULT NULL::numeric,
  "listing_type"         text                        DEFAULT 'free'::text,
  "search_vector"        tsvector,
  "is_ai_generated"      boolean                     DEFAULT false,
  "is_reposted"          boolean                     DEFAULT false,
  CONSTRAINT "chk_rating_range" CHECK (((rating IS NULL) OR ((rating >= (0)::numeric) AND (rating <= (5)::numeric)))),
  CONSTRAINT "tools_app_username_key" UNIQUE (app_username),
  CONSTRAINT "tools_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."tools"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_tools (
  search_query    text    DEFAULT NULL::text,
  filter_category text    DEFAULT NULL::text,
  filter_task     text    DEFAULT NULL::text,
  filter_pricing  text    DEFAULT NULL::text,
  result_limit    integer DEFAULT 100,
  result_offset   integer DEFAULT 0
)
  RETURNS SETOF public.tools
  LANGUAGE plpgsql
  STABLE
  SET search_path TO 'public', 'extensions'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.search_tools_count (
  search_query    text DEFAULT NULL::text,
  filter_category text DEFAULT NULL::text,
  filter_task     text DEFAULT NULL::text,
  filter_pricing  text DEFAULT NULL::text
)
  RETURNS bigint
  LANGUAGE plpgsql
  STABLE
  SET search_path TO 'public', 'extensions'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.tools_search_vector_update()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_modified_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_votes (
  p_tool_id       uuid,
  p_action        text,
  p_vote_type     text,
  p_previous_vote text DEFAULT NULL::text
)
  RETURNS TABLE (
    upvotes   integer,
    downvotes integer
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_submission_id_fkey" FOREIGN KEY (submission_id) REFERENCES public.tool_submissions(id) ON DELETE CASCADE;

ALTER TABLE "public"."notes"
  ADD CONSTRAINT "notes_tool_id_fkey" FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE SET NULL;

CREATE INDEX idx_categories_category_name ON public.categories USING btree (category_name);

CREATE INDEX idx_news_articles_category ON public.news_articles USING btree (category);

CREATE INDEX idx_news_articles_published_at ON public.news_articles USING btree (published_at DESC);

CREATE INDEX idx_news_articles_slug ON public.news_articles USING btree (slug);

CREATE INDEX idx_notes_tool_id ON public.notes USING btree (tool_id);

CREATE INDEX idx_payments_submission_id ON public.payments USING btree (submission_id);

CREATE INDEX idx_tags_tag_name ON public.tags USING btree (tag_name);

CREATE INDEX idx_tasks_task_name ON public.tasks USING btree (task_name);

CREATE INDEX idx_tool_submissions_submission_ref ON public.tool_submissions USING btree (submission_ref)
  WHERE (submission_ref IS NOT NULL);

CREATE INDEX idx_tools_app_username ON public.tools USING btree (app_username);

CREATE INDEX idx_tools_category_name_gin ON public.tools USING gin (category_name);

CREATE INDEX idx_tools_created_at ON public.tools USING btree (created_at DESC);

CREATE INDEX idx_tools_name_trgm ON public.tools USING gin (name extensions.gin_trgm_ops);

CREATE INDEX idx_tools_rating ON public.tools USING btree (rating DESC NULLS LAST);

CREATE INDEX idx_tools_save_count ON public.tools USING btree (save_count DESC);

CREATE INDEX idx_tools_search_vector ON public.tools USING gin (search_vector);

CREATE INDEX idx_tools_spotlight_position ON public.tools USING btree (spotlight_position);

CREATE INDEX idx_tools_status_created_at ON public.tools USING btree (status, created_at DESC);

CREATE INDEX idx_tools_status_save_count ON public.tools USING btree (status, save_count DESC);

CREATE INDEX idx_tools_status_spotlight ON public.tools USING btree (status, spotlight_enabled, spotlight_position);

CREATE INDEX idx_tools_status_trending ON public.tools USING btree (status, trending_position);

CREATE INDEX idx_tools_status ON public.tools USING btree (status);

CREATE INDEX idx_tools_tags_gin ON public.tools USING gin (tags);

CREATE INDEX idx_tools_task_name_gin ON public.tools USING gin (task_name);

CREATE INDEX idx_tools_trending_position ON public.tools USING btree (trending_position);

CREATE INDEX tools_created_at_idx ON public.tools USING btree (created_at);

CREATE TRIGGER update_blog_posts_modtime
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_news_articles_modtime
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER trg_tools_search_vector
  BEFORE INSERT OR UPDATE ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION public.tools_search_vector_update();

CREATE POLICY "Admins manage blog posts" ON "public"."blog_posts"
  FOR ALL
  TO PUBLIC
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "Public can read published blog posts" ON "public"."blog_posts"
  FOR SELECT
  TO PUBLIC
  USING ((status = 'published'::text));

CREATE POLICY "anon_read_categories" ON "public"."categories"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Admins manage news articles" ON "public"."news_articles"
  FOR ALL
  TO PUBLIC
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "Public can read news articles" ON "public"."news_articles"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Admins can delete notes" ON "public"."notes"
  FOR DELETE
  TO "authenticated"
  USING (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

CREATE POLICY "Admins can insert notes" ON "public"."notes"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

CREATE POLICY "Admins can read notes" ON "public"."notes"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

CREATE POLICY "Admins can update notes" ON "public"."notes"
  FOR UPDATE
  TO "authenticated"
  USING (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text))
  WITH CHECK (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

CREATE POLICY "payments_deny_all" ON "public"."payments"
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

CREATE POLICY "anon_read_settings" ON "public"."settings"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "anon_read_tags" ON "public"."tags"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "anon_read_tasks" ON "public"."tasks"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "tool_submissions_deny_all" ON "public"."tool_submissions"
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

CREATE POLICY "anon_read_published_tools" ON "public"."tools"
  FOR SELECT
  TO PUBLIC
  USING ((status = 'published'::text));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

COMMENT ON COLUMN "public"."tool_submissions"."submission_ref" IS 'Human-readable ref for display/emails, e.g. A250314093501';

COMMENT ON EXTENSION "hypopg" IS 'Hypothetical indexes for PostgreSQL';

COMMENT ON EXTENSION "index_advisor" IS 'Query index advisor';

COMMENT ON EXTENSION "pg_trgm" IS 'text similarity measurement and index searching based on trigrams';

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."search_tools"(text, text, text, text, integer, integer) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."search_tools_count"(text, text, text, text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."tools_search_vector_update"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_votes"(uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_votes"(uuid, text, text, text) TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blog_posts" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."categories" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."news_articles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notes" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payments" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."settings" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tags" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tasks" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tool_submissions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tools" TO "anon", "authenticated", "postgres", "service_role";

