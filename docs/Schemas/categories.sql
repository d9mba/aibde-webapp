create table public.categories (
  id uuid not null default gen_random_uuid (),
  category_name text not null,
  description text null,
  icon text null,
  count integer null default 0,
  created_at timestamp with time zone null default now(),
  constraint categories_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_categories_category_name on public.categories using btree (category_name) TABLESPACE pg_default;