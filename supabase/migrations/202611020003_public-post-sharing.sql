-- Permite que links compartilhados exibam a prévia pública da publicação.
-- Somente publicações marcadas como publicadas ficam acessíveis sem login.
drop policy if exists "Public can view shared posts" on public.posts;
create policy "Public can view shared posts"
on public.posts
for select
to anon, authenticated
using (published = true);

notify pgrst, 'reload schema';
