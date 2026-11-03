create table if not exists public.reading_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_color text not null default '#2E7D32',
  layout text not null default 'frase',
  started_on date,
  goal_on date,
  finished_on date,
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_key text not null,
  chapter int not null,
  color text not null,
  read_on date not null,
  primary key (user_id, book_key, chapter)
);

alter table public.reading_settings enable row level security;
alter table public.reading_progress enable row level security;

revoke all on public.reading_settings, public.reading_progress from anon;
grant select, insert, update, delete on public.reading_settings, public.reading_progress to authenticated;

alter table public.reading_settings drop constraint if exists reading_settings_layout_ck;
alter table public.reading_settings add constraint reading_settings_layout_ck
  check (layout in ('frase','capela','templo'));
alter table public.reading_settings drop constraint if exists reading_settings_color_ck;
alter table public.reading_settings add constraint reading_settings_color_ck
  check (active_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.reading_progress drop constraint if exists reading_progress_book_ck;
alter table public.reading_progress add constraint reading_progress_book_ck
  check (book_key in ('1ne','2ne','jac','eno','jar','omn','pdm','mos','alm','hel','3ne','4ne','mrm','eth','mor'));
alter table public.reading_progress drop constraint if exists reading_progress_chapter_ck;
alter table public.reading_progress add constraint reading_progress_chapter_ck
  check (chapter >= 1 and chapter <= case book_key
    when '1ne' then 22 when '2ne' then 33 when 'jac' then 7 when 'eno' then 1
    when 'jar' then 1 when 'omn' then 1 when 'pdm' then 1 when 'mos' then 29
    when 'alm' then 63 when 'hel' then 16 when '3ne' then 30 when '4ne' then 1
    when 'mrm' then 9 when 'eth' then 15 when 'mor' then 10 end);
alter table public.reading_progress drop constraint if exists reading_progress_color_ck;
alter table public.reading_progress add constraint reading_progress_color_ck
  check (color ~ '^#[0-9A-Fa-f]{6}$');
alter table public.reading_progress drop constraint if exists reading_progress_date_ck;
alter table public.reading_progress add constraint reading_progress_date_ck
  check (read_on <= current_date + 1);

drop policy if exists "leitura settings proprio" on public.reading_settings;
create policy "leitura settings proprio" on public.reading_settings
for all to authenticated
using (user_id = (select auth.uid()) and public.approved())
with check (user_id = (select auth.uid()) and public.approved());

drop policy if exists "leitura progresso proprio" on public.reading_progress;
create policy "leitura progresso proprio" on public.reading_progress
for all to authenticated
using (user_id = (select auth.uid()) and public.approved())
with check (user_id = (select auth.uid()) and public.approved());

notify pgrst, 'reload schema';