-- Dados oficiais da Visão para a Área — Setembro/2026.
-- A tabela é separada dos lançamentos manuais e a migração pode ser executada novamente.
-- indicator_key usa os rótulos existentes em src/planning.js para compatibilidade com goal_targets.
create table if not exists public.area_snapshots (
  id uuid primary key default gen_random_uuid(),
  ward_name text not null references public.wards(name) on update cascade on delete cascade,
  ref_month date not null,
  indicator_key text not null,
  value numeric not null check (value >= 0),
  source text not null default 'visao_area_oficial',
  created_at timestamptz not null default now(),
  unique (ward_name, ref_month, indicator_key)
);

alter table public.area_snapshots enable row level security;
drop policy if exists "approved users read area snapshots" on public.area_snapshots;
create policy "approved users read area snapshots"
on public.area_snapshots for select to authenticated
using (public.approved());

drop policy if exists "presidency admin manage area snapshots" on public.area_snapshots;
create policy "presidency admin manage area snapshots"
on public.area_snapshots for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'presidencia' or lower(p.email) = 'vargas.ywerio@gmail.com')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'presidencia' or lower(p.email) = 'vargas.ywerio@gmail.com')
  )
);

insert into public.area_snapshots (ward_name, ref_month, indicator_key, value, source)
values
  ('Altos','2026-09-01','Frequência sacramental',71,'visao_area_oficial'),
  ('Altos','2026-09-01','Membros participantes',91,'visao_area_oficial'),
  ('Altos','2026-09-01','Membros retornando',0,'visao_area_oficial'),
  ('Altos','2026-09-01','Membros jejuando',15,'visao_area_oficial'),
  ('Altos','2026-09-01','Batismos de conversos',6,'visao_area_oficial'),
  ('Altos','2026-09-01','Missionários do Brasil',5,'visao_area_oficial'),
  ('Altos','2026-09-01','Recomendações do templo com investidura',28,'visao_area_oficial'),
  ('Altos','2026-09-01','Recomendações do templo sem investidura',10,'visao_area_oficial'),
  ('Cidade Leste','2026-09-01','Frequência sacramental',74,'visao_area_oficial'),
  ('Cidade Leste','2026-09-01','Membros participantes',92,'visao_area_oficial'),
  ('Cidade Leste','2026-09-01','Membros retornando',0,'visao_area_oficial'),
  ('Cidade Leste','2026-09-01','Membros jejuando',4,'visao_area_oficial'),
  ('Cidade Leste','2026-09-01','Batismos de conversos',12,'visao_area_oficial'),
  ('Cidade Leste','2026-09-01','Missionários do Brasil',2,'visao_area_oficial'),
  ('Cidade Leste','2026-09-01','Recomendações do templo com investidura',46,'visao_area_oficial'),
  ('Cidade Leste','2026-09-01','Recomendações do templo sem investidura',11,'visao_area_oficial'),
  ('Satélite','2026-09-01','Frequência sacramental',64,'visao_area_oficial'),
  ('Satélite','2026-09-01','Membros participantes',114,'visao_area_oficial'),
  ('Satélite','2026-09-01','Membros retornando',0,'visao_area_oficial'),
  ('Satélite','2026-09-01','Membros jejuando',7,'visao_area_oficial'),
  ('Satélite','2026-09-01','Batismos de conversos',8,'visao_area_oficial'),
  ('Satélite','2026-09-01','Missionários do Brasil',0,'visao_area_oficial'),
  ('Satélite','2026-09-01','Recomendações do templo com investidura',15,'visao_area_oficial'),
  ('Satélite','2026-09-01','Recomendações do templo sem investidura',8,'visao_area_oficial'),
  ('Dom Pedro II','2026-09-01','Frequência sacramental',92,'visao_area_oficial'),
  ('Dom Pedro II','2026-09-01','Membros participantes',103,'visao_area_oficial'),
  ('Dom Pedro II','2026-09-01','Membros retornando',0,'visao_area_oficial'),
  ('Dom Pedro II','2026-09-01','Membros jejuando',10,'visao_area_oficial'),
  ('Dom Pedro II','2026-09-01','Batismos de conversos',11,'visao_area_oficial'),
  ('Dom Pedro II','2026-09-01','Missionários do Brasil',2,'visao_area_oficial'),
  ('Dom Pedro II','2026-09-01','Recomendações do templo com investidura',27,'visao_area_oficial'),
  ('Dom Pedro II','2026-09-01','Recomendações do templo sem investidura',39,'visao_area_oficial'),
  ('Horto','2026-09-01','Frequência sacramental',58,'visao_area_oficial'),
  ('Horto','2026-09-01','Membros participantes',64,'visao_area_oficial'),
  ('Horto','2026-09-01','Membros retornando',0,'visao_area_oficial'),
  ('Horto','2026-09-01','Membros jejuando',9,'visao_area_oficial'),
  ('Horto','2026-09-01','Batismos de conversos',6,'visao_area_oficial'),
  ('Horto','2026-09-01','Missionários do Brasil',0,'visao_area_oficial'),
  ('Horto','2026-09-01','Recomendações do templo com investidura',26,'visao_area_oficial'),
  ('Horto','2026-09-01','Recomendações do templo sem investidura',5,'visao_area_oficial'),
  ('Piçarreira','2026-09-01','Frequência sacramental',101,'visao_area_oficial'),
  ('Piçarreira','2026-09-01','Membros participantes',127,'visao_area_oficial'),
  ('Piçarreira','2026-09-01','Membros retornando',0,'visao_area_oficial'),
  ('Piçarreira','2026-09-01','Membros jejuando',12,'visao_area_oficial'),
  ('Piçarreira','2026-09-01','Batismos de conversos',15,'visao_area_oficial'),
  ('Piçarreira','2026-09-01','Missionários do Brasil',12,'visao_area_oficial'),
  ('Piçarreira','2026-09-01','Recomendações do templo com investidura',27,'visao_area_oficial'),
  ('Piçarreira','2026-09-01','Recomendações do templo sem investidura',18,'visao_area_oficial'),
  ('Taquari','2026-09-01','Frequência sacramental',81,'visao_area_oficial'),
  ('Taquari','2026-09-01','Membros participantes',109,'visao_area_oficial'),
  ('Taquari','2026-09-01','Membros retornando',0,'visao_area_oficial'),
  ('Taquari','2026-09-01','Membros jejuando',8,'visao_area_oficial'),
  ('Taquari','2026-09-01','Batismos de conversos',11,'visao_area_oficial'),
  ('Taquari','2026-09-01','Missionários do Brasil',3,'visao_area_oficial'),
  ('Taquari','2026-09-01','Recomendações do templo com investidura',39,'visao_area_oficial'),
  ('Taquari','2026-09-01','Recomendações do templo sem investidura',20,'visao_area_oficial'),
  ('Uruguai','2026-09-01','Frequência sacramental',72,'visao_area_oficial'),
  ('Uruguai','2026-09-01','Membros participantes',103,'visao_area_oficial'),
  ('Uruguai','2026-09-01','Membros retornando',0,'visao_area_oficial'),
  ('Uruguai','2026-09-01','Membros jejuando',12,'visao_area_oficial'),
  ('Uruguai','2026-09-01','Batismos de conversos',7,'visao_area_oficial'),
  ('Uruguai','2026-09-01','Missionários do Brasil',4,'visao_area_oficial'),
  ('Uruguai','2026-09-01','Recomendações do templo com investidura',42,'visao_area_oficial'),
  ('Uruguai','2026-09-01','Recomendações do templo sem investidura',27,'visao_area_oficial')
on conflict (ward_name, ref_month, indicator_key)
do update set value = excluded.value, source = excluded.source;

notify pgrst, 'reload schema';

-- Conferência: devem existir 8 alas por indicador e 64 registros no total.
select indicator_key, count(*) as alas, sum(value) as total
from public.area_snapshots
where ref_month = date '2026-09-01'
group by indicator_key
order by indicator_key;
