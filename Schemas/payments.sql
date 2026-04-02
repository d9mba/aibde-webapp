-- Schema for `payments` related entities
-- Auto-generated from schema.sql

-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    submitter_name text,
    submitter_email text,
    tool_name text,
    tool_url text,
    plan text,
    product_id text,
    payment_provider text,
    payment_id text,
    amount numeric,
    currency text,
    status text DEFAULT 'initiated'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    email_status text DEFAULT 'not_sent'::text,
    email_sent_at timestamp with time zone,
    email_provider_id text,
    failure_reason text,
    tax numeric DEFAULT 0,
    net_amount numeric DEFAULT 0,
    invoice_url text,
    CONSTRAINT payments_email_status_check CHECK ((email_status = ANY (ARRAY['not_sent'::text, 'sent'::text, 'failed'::text]))),
    CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['initiated'::text, 'success'::text, 'failed'::text])))
);


ALTER TABLE public.payments OWNER TO postgres;

-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

-- Name: idx_payments_submission_id; Type: INDEX; Schema: public; Owner: postgres
--
--

CREATE INDEX idx_payments_submission_id ON public.payments USING btree (submission_id);

-- Name: payments payments_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.tool_submissions(id) ON DELETE CASCADE;

-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Name: payments payments_deny_all; Type: POLICY; Schema: public; Owner: postgres
--
--

CREATE POLICY payments_deny_all ON public.payments USING (false) WITH CHECK (false);

-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--
--

GRANT ALL ON TABLE public.payments TO anon;
GRANT ALL ON TABLE public.payments TO authenticated;
GRANT ALL ON TABLE public.payments TO service_role;
