-- Garante que a política pública ampla seja removida também em bancos
-- onde a migration anterior já havia sido aplicada.
drop policy if exists "Public can view shared posts" on public.posts;
notify pgrst, 'reload schema';
