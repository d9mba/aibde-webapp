-- Schema for `settings` table
-- Last updated: 2026-04-02 — synced with DbSettings interface
-- Single-row config table for app-wide feature flags

create table public.settings (
  id integer primary key default 1,
  spotlight_count integer not null default 6,
  show_spotlight_on_home boolean not null default true,
  show_categories_on_home boolean not null default true,
  show_tasks_on_home boolean not null default true,
  show_top10_on_home boolean null default false,
  updated_at timestamp with time zone null default now(),

  -- Enforce single-row
  constraint settings_single_row check (id = 1)
);

-- Seed default row
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;