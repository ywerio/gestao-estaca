alter table public.reading_settings
  add column if not exists goal_type text not null default 'custom';

alter table public.reading_settings
  drop constraint if exists reading_settings_goal_type_ck;

alter table public.reading_settings
  add constraint reading_settings_goal_type_ck
  check (goal_type in ('3_months','6_months','12_months','custom'));

notify pgrst, 'reload schema';
