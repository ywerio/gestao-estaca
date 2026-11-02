-- Marca publicações que são restritas à liderança.
-- O cartão público de compartilhamento dessas publicações usa somente título genérico e logo.
alter table public.posts
  add column if not exists leaders_only boolean not null default false;
notify pgrst, 'reload schema';
