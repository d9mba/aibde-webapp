-- Schema for `tasks` related entities
-- Auto-generated from schema.sql

-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_name text NOT NULL,
    description text,
    icon text,
    count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tasks OWNER TO postgres;

-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);

-- Name: idx_tasks_task_name; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_tasks_task_name ON public.tasks USING btree (task_name);

-- Name: tasks anon_read_tasks; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY anon_read_tasks ON public.tasks FOR SELECT USING (true);

-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Name: TABLE tasks; Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON TABLE public.tasks TO anon;
GRANT ALL ON TABLE public.tasks TO authenticated;
GRANT ALL ON TABLE public.tasks TO service_role;
