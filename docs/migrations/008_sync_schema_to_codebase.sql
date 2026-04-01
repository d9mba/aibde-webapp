-- Migration 008: Sync schema to match codebase (2026-04-02)
--
-- This migration adds columns that the codebase references but were
-- missing from the database schema. Safe to run multiple times
-- (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
--
-- Run this in your Supabase SQL Editor on PRODUCTION before deploying.

-- ============================================================
-- 1. tools — add missing columns referenced by DbTool interface
-- ============================================================

-- Listing type (free, fast, verified, featured, spotlight)
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'free'::text;

-- Manual alternatives (admin-curated list)
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS manual_alternatives text[] NULL;

-- Legacy compat: screenshots array, video_url string, show_screenshots toggle
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS screenshots text[] NULL;

ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS video_url text NULL;

ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS show_screenshots boolean DEFAULT true;

-- Feature flags
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS is_reposted boolean DEFAULT false;

ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false;

-- Index for listing_type filtered queries
CREATE INDEX IF NOT EXISTS idx_tools_listing_type
  ON public.tools (listing_type);

-- ============================================================
-- 2. payments — add product_id column
-- ============================================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS product_id text;

-- Indexes that may be missing on older installs
CREATE INDEX IF NOT EXISTS idx_payments_submission_id
  ON public.payments (submission_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON public.payments (status);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
  ON public.payments (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_payment_id
  ON public.payments (payment_id)
  WHERE payment_id IS NOT NULL;

-- ============================================================
-- 3. tool_submissions — add indexes for dashboard queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tool_submissions_created_at
  ON public.tool_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_submissions_payment_status
  ON public.tool_submissions (payment_status);

CREATE INDEX IF NOT EXISTS idx_tool_submissions_review_status
  ON public.tool_submissions (review_status);

-- ============================================================
-- 4. settings — create if not exists (was incorrectly documented)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.settings (
  id integer PRIMARY KEY DEFAULT 1,
  spotlight_count integer NOT NULL DEFAULT 6,
  show_spotlight_on_home boolean NOT NULL DEFAULT true,
  show_categories_on_home boolean NOT NULL DEFAULT true,
  show_tasks_on_home boolean NOT NULL DEFAULT true,
  show_top10_on_home boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);

-- Seed default row if table was just created
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
