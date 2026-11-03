-- Gestão Estaca Horto: hardening de autorização, auditoria, índices e limite de geração de imagens.
-- Idempotente. Não altera nem remove registros existentes.

-- 1) Funções de autorização: o papel é validado no perfil aprovado, nunca no metadata do cadastro.
create or replace function public.is_presidency()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists (
    select 1 from public.profiles p
    where p.id=auth.uid() and p.status='approved'
      and (lower(p.email)='vargas.ywerio@gmail.com' or p.role in ('presidencia','admin'))
  );
$$;

create or replace function public.is_stake_secretary()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists (
    select 1 from public.profiles p
    where p.id=auth.uid() and p.status='approved'
      and p.unit_type='estaca' and p.role='secretaria'
  );
$$;

create or replace function public.is_approved_ward_leader(w text)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists (
    select 1 from public.profiles p
    where p.id=auth.uid() and p.status='approved' and p.unit_type='ala'
      and p.ward_name=w and p.role in ('bishop','counselor','secretary')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select public.is_presidency();
$$;

create or replace function public.approved()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='approved');
$$;

create or replace function public.can_ward(w text)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select public.is_presidency()
      or public.is_stake_secretary()
      or exists (
        select 1 from public.profiles p
        where p.id=auth.uid() and p.status='approved'
          and p.unit_type='ala' and p.ward_name=w
      );
$$;

create or replace function public.can_manage_ward(w text)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select public.is_presidency() or public.is_approved_ward_leader(w);
$$;

create or replace function public.can_manage_stake_events()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select public.is_presidency() or public.is_stake_secretary();
$$;

create or replace function public.can_read_post(p_id uuid)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists (
    select 1 from public.posts p
    where p.id=p_id and p.published=true and public.approved()
      and (
        public.is_presidency()
        or (p.unit_type='estaca' and (not p.leaders_only or public.is_stake_secretary()))
        or (p.unit_type='ala' and public.can_ward(p.ward_name)
            and (not p.leaders_only or public.is_approved_ward_leader(p.ward_name) or public.is_stake_secretary()))
      )
  );
$$;

-- Funções auxiliares: não devem ser endpoints RPC públicos.
revoke all on function public.is_presidency() from public,anon;
revoke all on function public.is_stake_secretary() from public,anon;
revoke all on function public.is_approved_ward_leader(text) from public,anon;
revoke all on function public.is_admin() from public,anon;
revoke all on function public.approved() from public,anon;
revoke all on function public.can_ward(text) from public,anon;
revoke all on function public.can_manage_ward(text) from public,anon;
revoke all on function public.can_manage_stake_events() from public,anon;
revoke all on function public.can_read_post(uuid) from public,anon;
grant execute on function public.is_presidency() to authenticated;
grant execute on function public.is_stake_secretary() to authenticated;
grant execute on function public.is_approved_ward_leader(text) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.approved() to authenticated;
grant execute on function public.can_ward(text) to authenticated;
grant execute on function public.can_manage_ward(text) to authenticated;
grant execute on function public.can_manage_stake_events() to authenticated;
grant execute on function public.can_read_post(uuid) to authenticated;
revoke all on function public.new_profile() from public,anon,authenticated;

-- 2) Impedir que o cadastro escolha a própria unidade ou papel.
create or replace function public.new_profile()
returns trigger language plpgsql security definer set search_path=public,auth as $$
begin
  if lower(new.email)='vargas.ywerio@gmail.com' then
    insert into public.profiles(id,email,full_name,unit_type,ward_name,role,status)
    values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','Administrador'),'estaca',null,'presidencia','approved')
    on conflict(id) do update set email=excluded.email,unit_type='estaca',ward_name=null,role='presidencia',status='approved';
  else
    insert into public.profiles(id,email,full_name,unit_type,ward_name,role,status)
    values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),'ala',null,'member','pending')
    on conflict(id) do nothing;
  end if;
  return new;
end;
$$;

-- 2.1) Completar a estrutura que o frontend já utiliza e que ainda não existia no banco.
alter table public.posts add column if not exists leaders_only boolean not null default false;

create table if not exists public.weekly_indicator_entries(
  id uuid primary key default gen_random_uuid(),
  ward_name text not null references public.wards(name),
  metric_name text not null,
  value numeric not null default 0 check(value >= 0),
  week_date date not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  constraint weekly_indicator_entries_ward_metric_week_key unique(ward_name,metric_name,week_date)
);
alter table public.weekly_indicator_entries enable row level security;
grant select,insert,update,delete on public.weekly_indicator_entries to authenticated;

-- 3) Recriar políticas nas tabelas críticas. Remover políticas antigas evita permissões OR inesperadas.
do $$
declare t text; p record;
begin
  foreach t in array array[
    'profiles','wards','posts','post_comments','indicator_entries',
    'weekly_indicator_entries','goal_targets','area_snapshots','events',
    'personal_events','daily_publications','notifications','indicator_baselines',
    'audit_logs','image_generation_limits'
  ] loop
    if to_regclass('public.'||t) is not null then
      for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
        execute format('drop policy if exists %I on public.%I',p.policyname,t);
      end loop;
    end if;
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.wards enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.indicator_entries enable row level security;
alter table public.weekly_indicator_entries enable row level security;
alter table public.goal_targets enable row level security;
alter table public.area_snapshots enable row level security;
alter table public.events enable row level security;
alter table public.personal_events enable row level security;
alter table public.daily_publications enable row level security;
alter table public.notifications enable row level security;
alter table public.indicator_baselines enable row level security;

-- Perfis: usuário lê o próprio; Presidência/Secretaria gerenciam acessos; só Presidência altera papéis.
create policy "profiles_select_own_or_stake_admin" on public.profiles
for select to authenticated using(id=auth.uid() or public.is_presidency() or public.is_stake_secretary());
create policy "profiles_update_presidency" on public.profiles
for update to authenticated using(public.is_presidency()) with check(public.is_presidency());
create policy "profiles_insert_self_pending" on public.profiles
for insert to authenticated with check(id=auth.uid() and status='pending' and role='member' and unit_type='ala' and ward_name is null);

create policy "wards_read_approved" on public.wards
for select to authenticated using(public.approved());

-- Publicações: membro lê publicações comuns da própria ala e da Estaca.
-- Conteúdo reservado exige liderança compatível; Secretaria acessa publicações da Estaca.
create policy "posts_read_in_scope" on public.posts
for select to authenticated using(public.can_read_post(id));

create policy "posts_insert_leadership_scope" on public.posts
for insert to authenticated with check(
  author_id=auth.uid() and published=true and (
    public.is_presidency()
    or (unit_type='estaca' and ward_name is null and public.is_stake_secretary())
    or (unit_type='ala' and public.is_approved_ward_leader(ward_name))
  )
);

create policy "posts_update_own_scope_or_presidency" on public.posts
for update to authenticated
using(author_id=auth.uid() and (
  (unit_type='estaca' and public.is_stake_secretary())
  or (unit_type='ala' and public.is_approved_ward_leader(ward_name))
) or public.is_presidency())
with check(
  public.is_presidency()
  or (author_id=auth.uid() and (
    (unit_type='estaca' and ward_name is null and public.is_stake_secretary())
    or (unit_type='ala' and public.is_approved_ward_leader(ward_name))
  ))
);

create policy "posts_delete_presidency" on public.posts
for delete to authenticated using(public.is_presidency());

-- Comentários seguem exatamente a visibilidade da publicação correspondente.
create policy "comments_read_visible_post" on public.post_comments
for select to authenticated using(public.can_read_post(post_id));
create policy "comments_insert_visible_post" on public.post_comments
for insert to authenticated with check(author_id=auth.uid() and public.can_read_post(post_id));
create policy "comments_update_own" on public.post_comments
for update to authenticated using(author_id=auth.uid() and public.can_read_post(post_id))
with check(author_id=auth.uid() and public.can_read_post(post_id));
create policy "comments_delete_own_or_presidency" on public.post_comments
for delete to authenticated using(author_id=auth.uid() or public.is_presidency());

-- Indicadores: leitura da própria ala; Secretaria/Presidência podem consultar o consolidado.
-- Escrita de resultados somente liderança da ala correspondente ou Presidência.
create policy "indicator_entries_read_scope" on public.indicator_entries
for select to authenticated using(public.can_ward(ward_name));
create policy "indicator_entries_write_scope" on public.indicator_entries
for all to authenticated using(public.can_manage_ward(ward_name))
with check(public.can_manage_ward(ward_name));

create policy "weekly_entries_read_scope" on public.weekly_indicator_entries
for select to authenticated using(public.can_ward(ward_name));
create policy "weekly_entries_write_scope" on public.weekly_indicator_entries
for all to authenticated using(public.can_manage_ward(ward_name))
with check(public.can_manage_ward(ward_name));

-- Metas oficiais e snapshots são alterados somente pela Presidência.
create policy "goal_targets_read_scope" on public.goal_targets
for select to authenticated using(public.can_ward(ward_name));
create policy "goal_targets_manage_presidency" on public.goal_targets
for all to authenticated using(public.is_presidency()) with check(public.is_presidency());

create policy "area_snapshots_read_scope" on public.area_snapshots
for select to authenticated using(public.can_ward(ward_name));
create policy "area_snapshots_manage_presidency" on public.area_snapshots
for all to authenticated using(public.is_presidency()) with check(public.is_presidency());

create policy "indicator_baselines_read_approved" on public.indicator_baselines
for select to authenticated using(public.approved());

-- Calendários: qualquer usuário aprovado lê eventos da Estaca/gerais e somente sua própria ala.
-- Presidência gerencia tudo; Secretaria apenas Estaca; bispado/conselho/secretário apenas sua ala.
create policy "events_read_scope" on public.events
for select to authenticated using(
  public.approved() and (
    unit_type in ('geral','estaca')
    or (unit_type='ala' and public.can_ward(ward_name))
  )
);

create policy "events_insert_scope" on public.events
for insert to authenticated with check(
  created_by=auth.uid() and (
    (public.is_presidency())
    or (unit_type='estaca' and ward_name is null and public.is_stake_secretary())
    or (unit_type='ala' and public.is_approved_ward_leader(ward_name))
  )
);

create policy "events_update_scope" on public.events
for update to authenticated
using(
  public.is_presidency()
  or (unit_type='estaca' and public.is_stake_secretary())
  or (unit_type='ala' and public.is_approved_ward_leader(ward_name))
)
with check(
  public.is_presidency()
  or (unit_type='estaca' and ward_name is null and public.is_stake_secretary())
  or (unit_type='ala' and public.is_approved_ward_leader(ward_name))
);

create policy "events_delete_scope" on public.events
for delete to authenticated using(
  public.is_presidency()
  or (unit_type='estaca' and public.is_stake_secretary())
  or (unit_type='ala' and public.is_approved_ward_leader(ward_name))
);

create policy "personal_events_own_all" on public.personal_events
for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create policy "daily_publications_presidency" on public.daily_publications
for all to authenticated using(public.is_presidency()) with check(public.is_presidency());

create policy "notifications_own_all" on public.notifications
for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- 4) Índices para filtros, relacionamentos e ordenação frequentes.
create index if not exists idx_indicator_entries_ward_month on public.indicator_entries(ward_name,month desc);
create index if not exists idx_weekly_entries_ward_week on public.weekly_indicator_entries(ward_name,week_date desc);
create index if not exists idx_snapshots_ward_month on public.area_snapshots(ward_name,ref_month desc);
create index if not exists idx_goal_targets_ward_year on public.goal_targets(ward_name,year);
create index if not exists idx_posts_scope_created on public.posts(unit_type,ward_name,created_at desc) where published=true;
create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_comments_post_created on public.post_comments(post_id,created_at);
create index if not exists idx_events_scope_date on public.events(unit_type,ward_name,event_date);
create index if not exists idx_personal_events_user_date on public.personal_events(user_id,date);
create index if not exists idx_profiles_ward_role_status on public.profiles(unit_type,ward_name,role,status);

-- 5) Registro de auditoria append-only, acessível somente à Presidência.
create table if not exists public.audit_logs(
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  operation text not null check(operation in ('INSERT','UPDATE','DELETE')),
  actor_id uuid,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);
alter table public.audit_logs enable row level security;
create policy "audit_logs_read_presidency" on public.audit_logs
for select to authenticated using(public.is_presidency());
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
create index if not exists idx_audit_logs_changed_at on public.audit_logs(changed_at desc);
create index if not exists idx_audit_logs_table_record on public.audit_logs(table_name,record_id,changed_at desc);

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path=public,auth as $$
declare old_row jsonb; new_row jsonb; row_id text;
begin
  if tg_op='INSERT' then
    new_row=to_jsonb(new); row_id=coalesce(new_row->>'id',new_row->>'email');
  elsif tg_op='UPDATE' then
    old_row=to_jsonb(old); new_row=to_jsonb(new); row_id=coalesce(new_row->>'id',new_row->>'email');
    if old_row=new_row then return new; end if;
  else
    old_row=to_jsonb(old); row_id=coalesce(old_row->>'id',old_row->>'email');
  end if;
  insert into public.audit_logs(table_name,record_id,operation,actor_id,old_data,new_data)
  values(tg_table_name,row_id,tg_op,auth.uid(),old_row,new_row);
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after insert or update or delete on public.profiles for each row execute function public.write_audit_log();
drop trigger if exists audit_posts on public.posts;
create trigger audit_posts after insert or update or delete on public.posts for each row execute function public.write_audit_log();
drop trigger if exists audit_indicator_entries on public.indicator_entries;
create trigger audit_indicator_entries after insert or update or delete on public.indicator_entries for each row execute function public.write_audit_log();
drop trigger if exists audit_weekly_entries on public.weekly_indicator_entries;
create trigger audit_weekly_entries after insert or update or delete on public.weekly_indicator_entries for each row execute function public.write_audit_log();
drop trigger if exists audit_goal_targets on public.goal_targets;
create trigger audit_goal_targets after insert or update or delete on public.goal_targets for each row execute function public.write_audit_log();
drop trigger if exists audit_area_snapshots on public.area_snapshots;
create trigger audit_area_snapshots after insert or update or delete on public.area_snapshots for each row execute function public.write_audit_log();
drop trigger if exists audit_events on public.events;
create trigger audit_events after insert or update or delete on public.events for each row execute function public.write_audit_log();

-- 6) Limite por usuário para geração de imagens: 5/hora e 20/dia.
create table if not exists public.image_generation_limits(
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_image_limits_user_created on public.image_generation_limits(user_id,created_at desc);
alter table public.image_generation_limits enable row level security;
revoke all on public.image_generation_limits from anon,authenticated;

create or replace function public.consume_image_generation_quota()
returns boolean language plpgsql security definer set search_path=public,auth as $$
declare uid uuid; hourly integer; daily integer;
begin
  uid=auth.uid();
  if uid is null or not public.approved() then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  delete from public.image_generation_limits where created_at < now()-interval '2 days';
  select count(*) into hourly from public.image_generation_limits
    where user_id=uid and created_at >= now()-interval '1 hour';
  select count(*) into daily from public.image_generation_limits
    where user_id=uid and created_at >= now()-interval '24 hours';
  if hourly>=5 or daily>=20 then return false; end if;
  insert into public.image_generation_limits(user_id) values(uid);
  return true;
end;
$$;
revoke all on function public.consume_image_generation_quota() from public,anon;
grant execute on function public.consume_image_generation_quota() to authenticated;

-- 7) Storage: manter leitura pública para imagens já publicadas; escrita só por liderança aprovada,
-- em pasta própria. O bucket permanece com limite de 5 MB e tipos de imagem permitidos.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('post-images','post-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "Approved leaders upload post images" on storage.objects;
create policy "Approved leaders upload own folder post images" on storage.objects
for insert to authenticated with check(
  bucket_id='post-images'
  and (storage.foldername(name))[1]=auth.uid()::text
  and exists(
    select 1 from public.profiles p where p.id=auth.uid() and p.status='approved'
      and (
        lower(p.email)='vargas.ywerio@gmail.com'
        or p.role in ('presidencia','secretaria','bishop','counselor','secretary')
      )
  )
);

drop policy if exists "Authors or admins delete post images" on storage.objects;
create policy "Authors or presidency delete own post images" on storage.objects
for delete to authenticated using(
  bucket_id='post-images'
  and (
    (storage.foldername(name))[1]=auth.uid()::text
    or public.is_presidency()
  )
);

drop policy if exists "Authors update own post images" on storage.objects;
create policy "Authors update own post images" on storage.objects
for update to authenticated
using(
  bucket_id='post-images'
  and (storage.foldername(name))[1]=auth.uid()::text
  and exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='approved'
    and (lower(p.email)='vargas.ywerio@gmail.com' or p.role in ('presidencia','secretaria','bishop','counselor','secretary')))
)
with check(
  bucket_id='post-images'
  and (storage.foldername(name))[1]=auth.uid()::text
  and exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='approved'
    and (lower(p.email)='vargas.ywerio@gmail.com' or p.role in ('presidencia','secretaria','bishop','counselor','secretary')))
);

revoke all on function public.write_audit_log() from public,anon,authenticated;

-- 8) Revoke access to privileged audit/quota tables and refresh PostgREST metadata.
revoke all on public.audit_logs from anon;
revoke all on public.image_generation_limits from anon,authenticated;
notify pgrst, 'reload schema';
