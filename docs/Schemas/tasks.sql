create table public.tasks (
  id uuid not null default gen_random_uuid (),
  task_name text not null,
  description text null,
  icon text null,
  count integer null default 0,
  created_at timestamp with time zone null default now(),
  constraint tasks_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_tasks_task_name on public.tasks using btree (task_name) TABLESPACE pg_default;