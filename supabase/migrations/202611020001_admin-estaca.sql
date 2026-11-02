-- Garantir que o administrador inicial seja cadastrado como unidade Estaca.
create or replace function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if lower(new.email)='vargas.ywerio@gmail.com' then
  insert into public.profiles(id,email,full_name,unit_type,ward_name,role,status)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','Administrador'), 'estaca',null,'presidencia','approved')
  on conflict(id) do update set unit_type='estaca',ward_name=null,role='presidencia',status='approved';
 else
  insert into public.profiles(id,email,full_name,unit_type,ward_name,role,status)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(new.raw_user_meta_data->>'unit_type','ala'),case when coalesce(new.raw_user_meta_data->>'unit_type','ala')='ala' then new.raw_user_meta_data->>'ward_name' else null end,'member','pending')
  on conflict(id) do nothing;
 end if;
 return new;
end $$;
