-- Schema for `tool_submissions` table
-- Last updated: 2026-04-02 — synced with submit-tool API route
-- Run this in your Supabase SQL Editor for fresh installs

create table public.tool_submissions (
  id uuid primary key default gen_random_uuid(),

  submission_ref text unique,

  tool_name text,
  website_url text,
  category text,
  pricing_model text,
  short_description text,
  full_description text,
  logo_url text,

  -- Expanded fields
  released_date text,
  video_urls text,            -- newline-separated URLs
  screenshot_urls text,       -- newline-separated URLs
  tags text,                  -- comma-separated
  key_features text,          -- newline-separated
  has_affiliate_program boolean default false,
  affiliate_url text,
  social_links jsonb,         -- array of {platform, url}

  submitter_name text,
  submitter_email text,

  plan_selected text,

  -- Mirrors payment status from `payments`
  payment_status text
    check (payment_status in ('initiated', 'success', 'failed'))
    default 'initiated',

  review_status text
    check (review_status in ('pending','draft','published','unpublished','scheduled'))
    default 'pending',

  created_at timestamptz not null default now()
);

alter table public.tool_submissions enable row level security;

-- Indexes
create index if not exists idx_tool_submissions_submission_ref
  on public.tool_submissions (submission_ref)
  where submission_ref is not null;

create index if not exists idx_tool_submissions_created_at
  on public.tool_submissions (created_at desc);

create index if not exists idx_tool_submissions_payment_status
  on public.tool_submissions (payment_status);

create index if not exists idx_tool_submissions_review_status
  on public.tool_submissions (review_status);