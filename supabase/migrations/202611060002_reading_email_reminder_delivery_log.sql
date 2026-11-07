alter table private.reading_email_reminder_log set schema public;
revoke all on public.reading_email_reminder_log from public, anon, authenticated;
grant all on public.reading_email_reminder_log to service_role;

alter table public.reading_email_reminder_log
  add column if not exists status text not null default 'sent',
  add column if not exists attempts integer not null default 1,
  add column if not exists last_error text;

alter table public.reading_email_reminder_log
  drop constraint if exists reading_email_reminder_log_status_ck;
alter table public.reading_email_reminder_log
  add constraint reading_email_reminder_log_status_ck
  check (status in ('processing','sent','failed'));
