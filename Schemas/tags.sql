-- Schema for `tags` related entities
-- Auto-generated from schema.sql

-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tag_name text NOT NULL,
    count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tags OWNER TO postgres;

-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (tag_name);

-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);

-- Name: idx_tags_tag_name; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tags_tag_name ON public.tags USING btree (tag_name);

-- Name: tags anon_read_tags; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY anon_read_tags ON public.tags FOR SELECT USING (true);

-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Name: TABLE tags; Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON TABLE public.tags TO anon;
GRANT ALL ON TABLE public.tags TO authenticated;
GRANT ALL ON TABLE public.tags TO service_role;
