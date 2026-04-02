-- Schema for `notes` related entities
-- Auto-generated from schema.sql

-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text,
    tool_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notes OWNER TO postgres;

-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);

-- Name: idx_notes_tool_id; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_notes_tool_id ON public.notes USING btree (tool_id);

-- Name: notes notes_tool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE SET NULL;

-- Name: notes Admins can delete notes; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY "Admins can delete notes" ON public.notes FOR DELETE TO authenticated USING (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

-- Name: notes Admins can insert notes; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY "Admins can insert notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

-- Name: notes Admins can read notes; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY "Admins can read notes" ON public.notes FOR SELECT TO authenticated USING (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

-- Name: notes Admins can update notes; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY "Admins can update notes" ON public.notes FOR UPDATE TO authenticated USING (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text)) WITH CHECK (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'admin'::text));

-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Name: TABLE notes; Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON TABLE public.notes TO anon;
GRANT ALL ON TABLE public.notes TO authenticated;
GRANT ALL ON TABLE public.notes TO service_role;
