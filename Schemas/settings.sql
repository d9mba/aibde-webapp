-- Schema for `settings` related entities
-- Auto-generated from schema.sql

-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--
--

CREATE TABLE public.settings (
    id integer DEFAULT 1 NOT NULL,
    spotlight_count integer DEFAULT 8,
    show_spotlight_on_home boolean DEFAULT true,
    show_categories_on_home boolean DEFAULT true,
    show_tasks_on_home boolean DEFAULT true,
    show_top10_on_home boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now(),
    show_featured_alternatives boolean DEFAULT true
);


ALTER TABLE public.settings OWNER TO postgres;

-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);

-- Name: settings anon_read_settings; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY anon_read_settings ON public.settings FOR SELECT USING (true);

-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Name: TABLE settings; Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON TABLE public.settings TO anon;
GRANT ALL ON TABLE public.settings TO authenticated;
GRANT ALL ON TABLE public.settings TO service_role;
