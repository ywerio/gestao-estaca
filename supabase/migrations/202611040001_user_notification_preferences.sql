-- Preferências individuais de notificações do Gestão Estaca Horto.
-- Preferências por conta, com padrões ligados para a própria Ala e para a Estaca.
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ward_posts boolean not null default true,
  stake_posts boolean not null default true,
  ward_events boolean not null default true,
  stake_events boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;
grant select, insert, update, delete on public.notification_preferences to authenticated;

drop policy if exists "users read own notification preferences" on public.notification_preferences;
create policy "users read own notification preferences"
on public.notification_preferences for select to authenticated
using (user_id = auth.uid());

drop policy if exists "users insert own notification preferences" on public.notification_preferences;
create policy "users insert own notification preferences"
on public.notification_preferences for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "users update own notification preferences" on public.notification_preferences;
create policy "users update own notification preferences"
on public.notification_preferences for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users delete own notification preferences" on public.notification_preferences;
create policy "users delete own notification preferences"
on public.notification_preferences for delete to authenticated
using (user_id = auth.uid());
