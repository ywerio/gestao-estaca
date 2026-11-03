# Leitura pessoal do Livro de Mórmon

O aplicativo oferece uma área pessoal para acompanhar a leitura dos 239 capítulos do Livro de Mórmon.

## Como funciona

- O progresso é individual e vinculado à conta autenticada.
- Cada capítulo pode ser marcado ou desmarcado na visualização em lista ou nos desenhos.
- As visualizações compartilham o mesmo progresso.
- Cada pessoa pode escolher a cor, o layout e uma data-meta.
- O progresso e as configurações são sincronizados nas tabelas `public.reading_progress` e `public.reading_settings` do Supabase.
- A fila local serve apenas para alterações temporariamente pendentes; o Supabase permanece como fonte oficial.

## Acesso

A área aparece no menu do aplicativo para usuários autenticados e aprovados.
