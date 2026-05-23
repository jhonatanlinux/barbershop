# Execucao no Supabase - barbershop

Projeto: `barbershop`
Project ID: `tamglucdiwkqgsxxzbav`
Regiao: `sa-east-1`
Project URL: `https://tamglucdiwkqgsxxzbav.supabase.co`

## Ordem de execucao

1. Abra o projeto no Supabase.
2. Va em **SQL Editor**.
3. Execute `docs/schema.sql`.
4. Execute `docs/seed.sql`.
5. Crie o admin executando uma copia local de `docs/create_admin.example.sql` com uma senha forte.
6. Va em **Table Editor** e confira:
   - `admins`
   - `clientes`
   - `catalogo_itens`
   - `config_sistema`
   - `resgates`
   - `pontos_historico`
   - `cortes`

## Seguranca

- Nao coloque `sb_secret` no app Expo.
- Nao versione chaves, senhas ou connection strings reais.
- Use a connection string do banco somente no backend.
- Como uma secret key foi compartilhada no chat, regenere/rotacione essa chave no painel do Supabase antes de publicar.

## Backend

Use `backend/.env.example` como modelo e crie um arquivo local `backend/.env`.

Nao envie `backend/.env` para o Git.
