-- Publicações com imagem e frequência sacramental semanal
alter table public.posts add column if not exists image_url text;

create table if not exists public.weekly_indicator_entries(
  id uuid primary key default gen_random_uuid(),
  ward_name text not null references public.wards(name),
  metric_name text not null default 'Frequência sacramental' check(metric_name='Frequência sacramental'),
  value integer not null check(value>=0),
  week_date date not null check(extract(dow from week_date)=0),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique(ward_name,metric_name,week_date)
);
alter table public.weekly_indicator_entries enable row level security;
drop policy if exists "read weekly indicators" on public.weekly_indicator_entries;
create policy "read weekly indicators" on public.weekly_indicator_entries for select to authenticated using(public.can_ward(ward_name));
drop policy if exists "write weekly indicators" on public.weekly_indicator_entries;
create policy "write weekly indicators" on public.weekly_indicator_entries for all to authenticated
using(
  public.is_admin() or exists(
    select 1 from public.profiles p where p.id=auth.uid() and p.status='approved'
    and p.ward_name=weekly_indicator_entries.ward_name
    and p.role in('bishop','counselor','secretary')
  )
)
with check(
  public.is_admin() or exists(
    select 1 from public.profiles p where p.id=auth.uid() and p.status='approved'
    and p.ward_name=weekly_indicator_entries.ward_name
    and p.role in('bishop','counselor','secretary')
  )
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('post-images','post-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public can view post images" on storage.objects;
create policy "Public can view post images" on storage.objects for select using(bucket_id='post-images');
drop policy if exists "Approved leaders upload post images" on storage.objects;
create policy "Approved leaders upload post images" on storage.objects for insert to authenticated
with check(
  bucket_id='post-images' and
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='approved'
    and (p.email='vargas.ywerio@gmail.com' or p.role in('presidencia','secretaria','bishop','counselor','secretary')))
);
drop policy if exists "Authors or admins delete post images" on storage.objects;
create policy "Authors or admins delete post images" on storage.objects for delete to authenticated
using(bucket_id='post-images' and (owner_id=auth.uid()::text or public.is_admin()));
