-- Migration: Add expanded submission fields to tool_submissions
-- Run this in Supabase SQL Editor before using the new form fields

ALTER TABLE public.tool_submissions
  ADD COLUMN IF NOT EXISTS submission_ref text,
  ADD COLUMN IF NOT EXISTS released_date text,
  ADD COLUMN IF NOT EXISTS video_urls text,
  ADD COLUMN IF NOT EXISTS screenshot_urls text,
  ADD COLUMN IF NOT EXISTS tags text,
  ADD COLUMN IF NOT EXISTS key_features text,
  ADD COLUMN IF NOT EXISTS has_affiliate_program boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_url text,
  ADD COLUMN IF NOT EXISTS social_links jsonb;
