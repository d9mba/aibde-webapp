create table public.tools (
  id uuid not null default gen_random_uuid (),
  name text not null,
  app_username text not null,
  summary text null,
  description text null,
  tags text[] null,
  pricing text null default 'freemium': :text,
  pricing_label text null,
  pricing_tiers jsonb null,
  has_free_trial boolean null default false,
  free_trial_days integer null,
  discount text null,
  billing_frequency text null,
  website_url text null,
  affiliate_url text null,
  affiliate_enabled boolean null default false,
  logo_url text null,
  images text[] null,
  videos text[] null,
  core_features text[] null,
  use_cases text[] null,
  pros text[] null,
  cons text[] null,
  faq jsonb null,
  version_history jsonb null,
  alternative_tools text[] null,
  tool_references text[] null,
  contact_name text null,
  contact_email text null,
  contact_company text null,
  contact_address text null,
  contact_mobile text null,
  social_links jsonb null,
  internal_notes jsonb null,
  save_count integer null default 0,
  released_on date null,
  is_featured boolean null default false,
  show_pricing boolean null default true,
  status text null default 'draft': :text,
  scheduled_at timestamp without time zone null,
  spotlight_enabled boolean null default false,
  spotlight_position integer null,
  spotlight_start_date timestamp without time zone null,
  spotlight_end_date timestamp without time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  play_store_url text null,
  app_store_url text null,
  category_name text[] null,
  task_name text[] null,
  back_links boolean null default false,
  rating numeric(2,1) null,
  view_count integer null default 0,
  upvotes integer null default 0,
  downvotes integer null default 0,
  trending_position integer null default 0,
  constraint tools_pkey primary key (id),
  constraint tools_app_username_key unique (app_username),
  constraint chk_rating_range check (rating is null or (rating >= 0 and rating <= 5))
) TABLESPACE pg_default;

create index IF not exists idx_tools_status on public.tools using btree (status) TABLESPACE pg_default;

create index IF not exists idx_tools_spotlight_position on public.tools using btree (spotlight_position) TABLESPACE pg_default;

create index IF not exists idx_tools_trending_position on public.tools using btree (trending_position) TABLESPACE pg_default;

create index IF not exists idx_tools_save_count on public.tools using btree (save_count desc) TABLESPACE pg_default;

create index IF not exists idx_tools_created_at on public.tools using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_tools_app_username on public.tools using btree (app_username) TABLESPACE pg_default;

create index IF not exists idx_tools_status_created_at on public.tools using btree (status, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_tools_status_spotlight on public.tools using btree (status, spotlight_enabled, spotlight_position) TABLESPACE pg_default;

create index IF not exists idx_tools_status_trending on public.tools using btree (status, trending_position) TABLESPACE pg_default;

create index IF not exists idx_tools_status_save_count on public.tools using btree (status, save_count desc) TABLESPACE pg_default;

create index IF not exists idx_tools_category_name_gin on public.tools using gin (category_name) TABLESPACE pg_default;

create index IF not exists idx_tools_task_name_gin on public.tools using gin (task_name) TABLESPACE pg_default;

create index IF not exists idx_tools_tags_gin on public.tools using gin (tags) TABLESPACE pg_default;

create index IF not exists tools_created_at_idx on public.tools using btree (created_at) TABLESPACE pg_default;