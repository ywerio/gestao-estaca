-- A leitura pública dos metadados de compartilhamento passa pela função serverless.
-- Removemos a política ampla que permitia a qualquer visitante consultar todas as colunas
-- de todas as publicações publicadas diretamente pela API REST do Supabase.
drop policy if exists "Public can view shared posts" on public.posts;

notify pgrst, 'reload schema';
