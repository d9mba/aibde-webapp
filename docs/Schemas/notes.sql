create table public.notes (
  id uuid not null default gen_random_uuid (),
  title text not null,
  content text null,
  tool_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint notes_pkey primary key (id),
  constraint notes_tool_id_fkey foreign KEY (tool_id) references tools (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_notes_tool_id on public.notes using btree (tool_id) TABLESPACE pg_default;