-- Gestão Estaca Horto: metas oficiais 2026/2027, índices de referência e calendário geral 2027.
-- Migração aditiva e idempotente: preserva lançamentos, eventos e agendas já existentes.

create table if not exists public.goal_targets (
  id uuid primary key default gen_random_uuid(),
  ward_name text not null references public.wards(name),
  year integer not null check(year in (2026,2027)),
  indicator_key text not null,
  target integer not null check(target>=0),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique(ward_name,year,indicator_key)
);
alter table public.goal_targets enable row level security;
drop policy if exists "read goal targets" on public.goal_targets;
create policy "read goal targets" on public.goal_targets for select to authenticated using(public.approved());
drop policy if exists "manage goal targets" on public.goal_targets;
create policy "manage goal targets" on public.goal_targets for all to authenticated
using(public.is_admin()) with check(public.is_admin());

create table if not exists public.indicator_baselines (
  indicator_key text primary key,
  baseline_value integer not null check(baseline_value>=0),
  baseline_label text not null default '3º trimestre de 2025'
);
alter table public.indicator_baselines enable row level security;
drop policy if exists "read indicator baselines" on public.indicator_baselines;
create policy "read indicator baselines" on public.indicator_baselines for select to authenticated using(public.approved());

insert into public.indicator_baselines(indicator_key,baseline_value,baseline_label) values
('Frequência sacramental',611,'3º trimestre de 2025'),
('Membros participantes',803,'3º trimestre de 2025'),
('Membros retornando',2955,'3º trimestre de 2025'),
('Membros jejuando',78,'3º trimestre de 2025'),
('Batismos de conversos',112,'3º trimestre de 2025'),
('Missionários do Brasil',28,'3º trimestre de 2025'),
('Recomendações do templo com investidura',214,'3º trimestre de 2025'),
('Recomendações do templo sem investidura',141,'3º trimestre de 2025')
on conflict(indicator_key) do update set baseline_value=excluded.baseline_value,baseline_label=excluded.baseline_label;

insert into public.goal_targets(ward_name,year,indicator_key,target) values
('Altos',2026,'Frequência sacramental',105),
('Altos',2026,'Membros participantes',105),
('Altos',2026,'Membros retornando',36),
('Altos',2026,'Membros jejuando',55),
('Altos',2026,'Batismos de conversos',36),
('Altos',2026,'Missionários do Brasil',9),
('Altos',2026,'Recomendações do templo com investidura',35),
('Altos',2026,'Recomendações do templo sem investidura',50),
('Altos',2027,'Frequência sacramental',115),
('Altos',2027,'Membros participantes',115),
('Altos',2027,'Membros retornando',39),
('Altos',2027,'Membros jejuando',60),
('Altos',2027,'Batismos de conversos',39),
('Altos',2027,'Missionários do Brasil',10),
('Altos',2027,'Recomendações do templo com investidura',38),
('Altos',2027,'Recomendações do templo sem investidura',55),
('Cidade Leste',2026,'Frequência sacramental',120),
('Cidade Leste',2026,'Membros participantes',96),
('Cidade Leste',2026,'Membros retornando',20),
('Cidade Leste',2026,'Membros jejuando',50),
('Cidade Leste',2026,'Batismos de conversos',32),
('Cidade Leste',2026,'Missionários do Brasil',4),
('Cidade Leste',2026,'Recomendações do templo com investidura',40),
('Cidade Leste',2026,'Recomendações do templo sem investidura',30),
('Cidade Leste',2027,'Frequência sacramental',130),
('Cidade Leste',2027,'Membros participantes',100),
('Cidade Leste',2027,'Membros retornando',20),
('Cidade Leste',2027,'Membros jejuando',60),
('Cidade Leste',2027,'Batismos de conversos',32),
('Cidade Leste',2027,'Missionários do Brasil',6),
('Cidade Leste',2027,'Recomendações do templo com investidura',45),
('Cidade Leste',2027,'Recomendações do templo sem investidura',35),
('Satélite',2026,'Frequência sacramental',80),
('Satélite',2026,'Membros participantes',85),
('Satélite',2026,'Membros retornando',20),
('Satélite',2026,'Membros jejuando',25),
('Satélite',2026,'Batismos de conversos',20),
('Satélite',2026,'Missionários do Brasil',2),
('Satélite',2026,'Recomendações do templo com investidura',40),
('Satélite',2026,'Recomendações do templo sem investidura',25),
('Satélite',2027,'Frequência sacramental',100),
('Satélite',2027,'Membros participantes',100),
('Satélite',2027,'Membros retornando',20),
('Satélite',2027,'Membros jejuando',30),
('Satélite',2027,'Batismos de conversos',20),
('Satélite',2027,'Missionários do Brasil',5),
('Satélite',2027,'Recomendações do templo com investidura',45),
('Satélite',2027,'Recomendações do templo sem investidura',30),
('Dom Pedro II',2026,'Frequência sacramental',105),
('Dom Pedro II',2026,'Membros participantes',105),
('Dom Pedro II',2026,'Membros retornando',23),
('Dom Pedro II',2026,'Membros jejuando',65),
('Dom Pedro II',2026,'Batismos de conversos',21),
('Dom Pedro II',2026,'Missionários do Brasil',6),
('Dom Pedro II',2026,'Recomendações do templo com investidura',37),
('Dom Pedro II',2026,'Recomendações do templo sem investidura',45),
('Dom Pedro II',2027,'Frequência sacramental',131),
('Dom Pedro II',2027,'Membros participantes',131),
('Dom Pedro II',2027,'Membros retornando',29),
('Dom Pedro II',2027,'Membros jejuando',81),
('Dom Pedro II',2027,'Batismos de conversos',26),
('Dom Pedro II',2027,'Missionários do Brasil',8),
('Dom Pedro II',2027,'Recomendações do templo com investidura',46),
('Dom Pedro II',2027,'Recomendações do templo sem investidura',56),
('Horto',2026,'Frequência sacramental',75),
('Horto',2026,'Membros participantes',70),
('Horto',2026,'Membros retornando',20),
('Horto',2026,'Membros jejuando',15),
('Horto',2026,'Batismos de conversos',10),
('Horto',2026,'Missionários do Brasil',3),
('Horto',2026,'Recomendações do templo com investidura',25),
('Horto',2026,'Recomendações do templo sem investidura',10),
('Horto',2027,'Frequência sacramental',85),
('Horto',2027,'Membros participantes',80),
('Horto',2027,'Membros retornando',25),
('Horto',2027,'Membros jejuando',20),
('Horto',2027,'Batismos de conversos',15),
('Horto',2027,'Missionários do Brasil',5),
('Horto',2027,'Recomendações do templo com investidura',30),
('Horto',2027,'Recomendações do templo sem investidura',15),
('Piçarreira',2026,'Frequência sacramental',130),
('Piçarreira',2026,'Membros participantes',120),
('Piçarreira',2026,'Membros retornando',30),
('Piçarreira',2026,'Membros jejuando',30),
('Piçarreira',2026,'Batismos de conversos',24),
('Piçarreira',2026,'Missionários do Brasil',14),
('Piçarreira',2026,'Recomendações do templo com investidura',25),
('Piçarreira',2026,'Recomendações do templo sem investidura',45),
('Piçarreira',2027,'Frequência sacramental',145),
('Piçarreira',2027,'Membros participantes',140),
('Piçarreira',2027,'Membros retornando',45),
('Piçarreira',2027,'Membros jejuando',50),
('Piçarreira',2027,'Batismos de conversos',40),
('Piçarreira',2027,'Missionários do Brasil',12),
('Piçarreira',2027,'Recomendações do templo com investidura',30),
('Piçarreira',2027,'Recomendações do templo sem investidura',50),
('Taquari',2026,'Frequência sacramental',130),
('Taquari',2026,'Membros participantes',80),
('Taquari',2026,'Membros retornando',10),
('Taquari',2026,'Membros jejuando',70),
('Taquari',2026,'Batismos de conversos',10),
('Taquari',2026,'Missionários do Brasil',5),
('Taquari',2026,'Recomendações do templo com investidura',70),
('Taquari',2026,'Recomendações do templo sem investidura',30),
('Taquari',2027,'Frequência sacramental',140),
('Taquari',2027,'Membros participantes',90),
('Taquari',2027,'Membros retornando',15),
('Taquari',2027,'Membros jejuando',80),
('Taquari',2027,'Batismos de conversos',15),
('Taquari',2027,'Missionários do Brasil',10),
('Taquari',2027,'Recomendações do templo com investidura',80),
('Taquari',2027,'Recomendações do templo sem investidura',40),
('Uruguai',2026,'Frequência sacramental',100),
('Uruguai',2026,'Membros participantes',130),
('Uruguai',2026,'Membros retornando',24),
('Uruguai',2026,'Membros jejuando',60),
('Uruguai',2026,'Batismos de conversos',15),
('Uruguai',2026,'Missionários do Brasil',6),
('Uruguai',2026,'Recomendações do templo com investidura',40),
('Uruguai',2026,'Recomendações do templo sem investidura',40),
('Uruguai',2027,'Frequência sacramental',115),
('Uruguai',2027,'Membros participantes',145),
('Uruguai',2027,'Membros retornando',24),
('Uruguai',2027,'Membros jejuando',70),
('Uruguai',2027,'Batismos de conversos',18),
('Uruguai',2027,'Missionários do Brasil',7),
('Uruguai',2027,'Recomendações do templo com investidura',45),
('Uruguai',2027,'Recomendações do templo sem investidura',60)
on conflict(ward_name,year,indicator_key) do update set target=excluded.target;

-- Calendário: mantém compromissos existentes e acrescenta campos opcionais à agenda pessoal.
alter table public.personal_events add column if not exists event_time text;
alter table public.personal_events add column if not exists location text;
alter table public.personal_events add column if not exists created_at timestamptz not null default now();
alter table public.events add column if not exists source_key text;
create unique index if not exists events_source_key_unique on public.events(source_key) where source_key is not null;

drop policy if exists "read events" on public.events;
create policy "read events" on public.events for select to authenticated
using(public.approved() and (unit_type in ('geral','estaca') or (unit_type='ala' and public.can_ward(ward_name))));
drop policy if exists "admin events" on public.events;
drop policy if exists "leadership manage events" on public.events;
create policy "leadership manage events" on public.events for all to authenticated
using(
  public.is_admin() or exists(
    select 1 from public.profiles p where p.id=auth.uid() and p.status='approved'
    and p.unit_type='ala' and p.ward_name=events.ward_name
    and p.role in ('bishop','counselor','secretary')
  )
)
with check(
  public.is_admin() or exists(
    select 1 from public.profiles p where p.id=auth.uid() and p.status='approved'
    and p.unit_type='ala' and p.ward_name=events.ward_name
    and p.role in ('bishop','counselor','secretary')
  )
);

insert into public.events(source_key,event_date,title,description,unit_type,location)
values
('church-2027-01','2027-01-16','“Alegrar-se em Cristo” — recurso mundial para os jovens','Vídeo disponível para uso em reuniões, atividades e devocionais.','geral','Transmissão mundial / Igreja'),
('church-2027-02','2027-02-07','Devocional Mundial para os Jovens Adultos','Transmissão mundial para jovens adultos.','geral','Transmissão mundial / Igreja'),
('church-2027-03','2027-03-04','Instrução sobre templo e história da família para a liderança','Recurso de treinamento disponível para conselhos e líderes.','geral','Transmissão mundial / Igreja'),
('church-2027-04','2027-03-04','RootsTech 2027','Evento mundial de história da família, de 4 a 6 de março.','geral','Transmissão mundial / Igreja'),
('church-2027-05','2027-03-06','Dia de Descoberta Familiar','Transmissão mundial sobre descoberta familiar.','geral','Transmissão mundial / Igreja'),
('church-2027-06','2027-03-06','Devocional Mundial da Sociedade de Socorro','Recurso mundial disponível para as mulheres.','geral','Transmissão mundial / Igreja'),
('church-2027-07','2027-03-21','Início da Semana Santa — Domingo de Ramos','Período de preparação para a Páscoa, de 21 a 28 de março.','geral','Transmissão mundial / Igreja'),
('church-2027-08','2027-03-28','Domingo de Páscoa','Celebração da Ressurreição de Jesus Cristo.','geral','Transmissão mundial / Igreja'),
('church-2027-09','2027-04-03','Conferência Geral — sessões de sábado','Conferência Geral em 3 e 4 de abril.','geral','Transmissão mundial / Igreja'),
('church-2027-10','2027-04-04','Conferência Geral — sessões de domingo','Conferência Geral em 3 e 4 de abril.','geral','Transmissão mundial / Igreja'),
('church-2027-11','2027-04-05','Comemoração do Templo de Salt Lake','Programação presencial e virtual de 5 de abril a 1º de outubro.','geral','Transmissão mundial / Igreja'),
('church-2027-12','2027-05-02','Devocional Mundial para os Jovens Adultos','Transmissão mundial para jovens adultos.','geral','Transmissão mundial / Igreja'),
('church-2027-13','2027-05-22','Vídeo De Amigo para Amigo — Primária','Recurso mundial para crianças e líderes da Primária.','geral','Transmissão mundial / Igreja'),
('church-2027-14','2027-06-10','Conferência de Educadores Religiosos','Transmissão em 10 e 11 de junho.','geral','Transmissão mundial / Igreja'),
('church-2027-15','2027-06-11','Conferência de Educadores Religiosos','Transmissão em 10 e 11 de junho.','geral','Transmissão mundial / Igreja'),
('church-2027-16','2027-09-04','Vídeo De Amigo para Amigo — Primária','Recurso mundial para crianças e líderes da Primária.','geral','Transmissão mundial / Igreja'),
('church-2027-17','2027-10-01','Encerramento da comemoração do Templo de Salt Lake','Evento mundial de encerramento.','geral','Transmissão mundial / Igreja'),
('church-2027-18','2027-10-02','Conferência Geral — sessões de sábado','Conferência Geral em 2 e 3 de outubro.','geral','Transmissão mundial / Igreja'),
('church-2027-19','2027-10-03','Conferência Geral — sessões de domingo','Conferência Geral em 2 e 3 de outubro.','geral','Transmissão mundial / Igreja'),
('church-2027-20','2027-11-07','Devocional Mundial para os Jovens Adultos','Transmissão mundial para jovens adultos.','geral','Transmissão mundial / Igreja'),
('church-2027-21','2027-12-05','Devocional de Natal da Primeira Presidência','Transmissão mundial de Natal.','geral','Transmissão mundial / Igreja'),
('church-2027-22','2027-12-19','Reunião sacramental especial de Natal — data sugerida','As alas podem realizar a reunião especial em 19 ou 26 de dezembro.','geral','Transmissão mundial / Igreja'),
('church-2027-23','2027-12-26','Reunião sacramental especial de Natal — data alternativa','As alas podem realizar a reunião especial em 19 ou 26 de dezembro.','geral','Transmissão mundial / Igreja')
insert into public.events(source_key,event_date,title,description,unit_type,location) values
('church-2027-extra-1','2027-01-01','Início do estudo do Novo Testamento — Vem, e Segue-Me','Estudo do Novo Testamento ao longo de todo o ano de 2027.','geral','Transmissão mundial / Igreja'),
('church-2027-extra-2','2027-01-01','Atualização dos horários das reuniões','Ação para bispados e secretários quando houver alteração dos horários da unidade.','geral','Transmissão mundial / Igreja'),
('church-2027-extra-3','2027-04-10','Abertura da comemoração do Templo de Salt Lake','Evento especial com música e apresentações na comemoração do templo.','geral','Transmissão mundial / Igreja'),
('church-2027-extra-4','2027-05-01','Ao vivo da Praça do Templo','Série de transmissões de maio a outubro, com horários conforme cada área.','geral','Transmissão mundial / Igreja'),
('church-2027-extra-5','2027-09-01','Período de declaração do dízimo','Os bispos conversam com membros entre setembro e dezembro.','geral','Transmissão mundial / Igreja'),
('church-2027-extra-6','2027-12-01','Época de Natal','Período de 1º a 25 de dezembro para atividades e serviços centralizados em Jesus Cristo.','geral','Transmissão mundial / Igreja')
on conflict(source_key) where source_key is not null do update set event_date=excluded.event_date,title=excluded.title,description=excluded.description,unit_type=excluded.unit_type,location=excluded.location;

on conflict(source_key) where source_key is not null
do update set event_date=excluded.event_date,title=excluded.title,description=excluded.description,unit_type=excluded.unit_type,location=excluded.location;

-- A tabela personal_events já tem política de acesso exclusivo ao próprio usuário.
