-- Schema for `tool_submissions` related entities
-- Auto-generated from schema.sql

-- Name: tool_submissions; Type: TABLE; Schema: public; Owner: postgres
--
--

CREATE TABLE public.tool_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tool_name text,
    website_url text,
    category text,
    pricing_model text,
    short_description text,
    full_description text,
    logo_url text,
    submitter_name text,
    submitter_email text,
    plan_selected text,
    review_status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_status text DEFAULT 'initiated'::text,
    submission_ref text,
    released_date text,
    video_urls text,
    screenshot_urls text,
    tags text,
    key_features text,
    has_affiliate_program boolean DEFAULT false,
    affiliate_url text,
    social_links jsonb,
    tool_id uuid,
    app_username text,
    CONSTRAINT tool_submissions_payment_status_check CHECK ((payment_status = ANY (ARRAY['initiated'::text, 'success'::text, 'failed'::text]))),
    CONSTRAINT tool_submissions_review_status_check CHECK ((review_status = ANY (ARRAY['pending'::text, 'draft'::text, 'published'::text, 'unpublished'::text, 'scheduled'::text])))
);


ALTER TABLE public.tool_submissions OWNER TO postgres;

-- Name: COLUMN tool_submissions.submission_ref; Type: COMMENT; Schema: public; Owner: postgres
--
--

COMMENT ON COLUMN public.tool_submissions.submission_ref IS 'Human-readable ref for display/emails, e.g. A250314093501';

-- Name: tool_submissions tool_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.tool_submissions
    ADD CONSTRAINT tool_submissions_pkey PRIMARY KEY (id);

-- Name: tool_submissions tool_submissions_submission_ref_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.tool_submissions
    ADD CONSTRAINT tool_submissions_submission_ref_key UNIQUE (submission_ref);

-- Name: idx_tool_submissions_submission_ref; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tool_submissions_submission_ref ON public.tool_submissions USING btree (submission_ref) WHERE (submission_ref IS NOT NULL);

-- Name: tool_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--
--

ALTER TABLE public.tool_submissions ENABLE ROW LEVEL SECURITY;

-- Name: tool_submissions tool_submissions_deny_all; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY tool_submissions_deny_all ON public.tool_submissions USING (false) WITH CHECK (false);

-- Name: TABLE tool_submissions; Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON TABLE public.tool_submissions TO anon;
GRANT ALL ON TABLE public.tool_submissions TO authenticated;
GRANT ALL ON TABLE public.tool_submissions TO service_role;
