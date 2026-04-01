-- Schema for `payments` table
-- Last updated: 2026-04-02 — synced with submit-tool + webhook code
-- Run this in your Supabase SQL Editor for fresh installs

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key to tool_submissions
  submission_id uuid REFERENCES public.tool_submissions(id) ON DELETE CASCADE,

  plan text,
  tool_name text,
  tool_url text,
  submitter_name text,
  submitter_email text,

  -- Payment specifics
  payment_provider text,
  payment_id text,              -- Provider's payment/session ID (e.g. Dodo payment_id)
  product_id text,              -- Provider's product ID used for checkout
  amount numeric DEFAULT 0,
  currency text,
  status text CHECK (status IN ('initiated', 'success', 'failed')) DEFAULT 'initiated',
  failure_reason text,

  -- Billing/Tax fields
  tax numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  invoice_url text,

  -- Email tracking
  email_status text CHECK (email_status IN ('pending', 'sent', 'failed', 'not_sent')) DEFAULT 'not_sent',
  email_sent_at timestamptz,
  email_provider_id text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Indexes for dashboard queries and webhook lookups
CREATE INDEX IF NOT EXISTS idx_payments_submission_id ON public.payments (submission_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments (payment_id) WHERE payment_id IS NOT NULL;
