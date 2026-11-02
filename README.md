# Gestão Estaca Horto
PWA React + Supabase para gestão de indicadores, publicações, eventos e acessos.

## Unidades
Alas em ordem alfabética: Altos, Cidade Leste, Dom Pedro II, Horto, Piçarreira, Satélite, Taquari e Uruguai.

## Indicadores iguais para Ala e Estaca
- VIVER: Frequência sacramental; Membros participantes.
- CUIDAR: Membros retornando; Membros jejuando.
- CONVIDAR: Batismos de conversos; Missionários do Brasil.
- UNIR: Recomendações do templo com investidura; Recomendações do templo sem investidura.
A Estaca consolida as oito Alas. Valores e metas começam em branco.

## Ativação
1. Crie um projeto Supabase e execute supabase/schema.sql no SQL Editor.
2. Configure Auth por e-mail e confirmação de e-mail.
3. Cadastre o primeiro usuário com vargas.ywerio@gmail.com; o trigger aprova apenas esse e-mail automaticamente. Defina a senha no próprio cadastro.
4. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY a partir de .env.example no serviço de hospedagem.
5. Publique com npm install, npm run build; saída dist. Pode importar o repositório no Vercel.

## Publicações diárias automáticas
A Edge Function supabase/functions/publish-daily publica o conteúdo da tabela daily_publications na data programada. Faça deploy, configure DAILY_PUBLISH_SECRET e SUPABASE_SERVICE_ROLE_KEY como secrets e agende chamada diária às 08:00 no fuso de Fortaleza via Supabase Cron. A liderança deve cadastrar previamente texto e URL oficial verificada. O sistema automatiza a publicação, não inventa citações nem atribui frases sem fonte.

## Acesso e segurança
Usuários novos ficam pendentes até aprovação. O administrador aprova e define unidade e papel. RLS protege dados no banco: membros pendentes não acessam; liderança da Ala opera a própria unidade; Presidência/Secretaria da Estaca administram e consolidam. Nunca exponha service role key no frontend.

## Escopo da primeira entrega
A interface inicial e o esquema do banco estão versionados. Ainda exigem configuração externa Supabase e hospedagem para login e sincronização reais. Importação de calendários oficiais, notificações push e preenchimento de conteúdo diário a partir de fonte oficial exigem integração/curadoria adicional.