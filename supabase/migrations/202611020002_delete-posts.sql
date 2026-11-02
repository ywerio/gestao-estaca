-- Permitir exclusão global de publicações somente à Presidência e Secretaria da Estaca.
-- A autorização é validada no banco, não apenas pela interface.
drop policy if exists "stake leadership delete posts" on public.posts;
create policy "stake leadership delete posts"
on public.posts
for delete
to authenticated
using (public.is_admin());
