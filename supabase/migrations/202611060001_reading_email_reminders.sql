create table if not exists public.reading_email_reminders (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  reminder_time time not null default time '20:00',
  timezone text not null default 'America/Fortaleza',
  updated_at timestamptz not null default now()
);

alter table public.reading_email_reminders enable row level security;

create policy "members read own reading email reminder"
  on public.reading_email_reminders for select to authenticated
  using (user_id = (select auth.uid()));

create policy "members insert own reading email reminder"
  on public.reading_email_reminders for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "members update own reading email reminder"
  on public.reading_email_reminders for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.reading_email_reminders to authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.reading_email_reminder_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_date date not null,
  sent_at timestamptz not null default now(),
  provider_message_id text,
  primary key (user_id, reminder_date)
);
alter table private.reading_email_reminder_log enable row level security;
revoke all on private.reading_email_reminder_log from public, anon, authenticated;
grant usage on schema private to service_role;
grant all on private.reading_email_reminder_log to service_role;

create index if not exists reading_email_reminders_enabled_time_idx
  on public.reading_email_reminders (reminder_time)
  where enabled = true;
