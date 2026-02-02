create table public.tags (
  id uuid not null default gen_random_uuid (),
  tag_name text not null,
  count integer null default 0,
  created_at timestamp with time zone null default now(),
  constraint tags_pkey primary key (id),
  constraint tags_name_key unique (tag_name)
) TABLESPACE pg_default;

create index IF not exists idx_tags_tag_name on public.tags using btree (tag_name) TABLESPACE pg_default;