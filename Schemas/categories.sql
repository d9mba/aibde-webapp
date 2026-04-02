-- Schema for `categories` related entities
-- Auto-generated from schema.sql

-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_name text NOT NULL,
    description text,
    icon text,
    count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO postgres;

-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

-- Name: idx_categories_category_name; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_categories_category_name ON public.categories USING btree (category_name);

-- Name: categories anon_read_categories; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY anon_read_categories ON public.categories FOR SELECT USING (true);

-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Name: TABLE categories; Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.categories TO service_role;
