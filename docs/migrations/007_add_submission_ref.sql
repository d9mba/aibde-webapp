-- Human-readable submission ID: A + YYMMDD + HHMMSS + 2-digit suffix (e.g. A250314093501)
-- Keeps tool_submissions.id as UUID for FKs; submission_ref is for display and support.

alter table public.tool_submissions
  add column if not exists submission_ref text unique;

comment on column public.tool_submissions.submission_ref is 'Human-readable ref for display/emails, e.g. A250314093501';

create index if not exists idx_tool_submissions_submission_ref
  on public.tool_submissions (submission_ref)
  where submission_ref is not null;
