# Setup Supabase e Deploy

## Supabase

1. Crie o projeto no Supabase.
2. Abra **SQL Editor**.
3. Execute `docs/schema.sql`.
4. Execute `docs/seed.sql`.
5. Execute uma copia local de `docs/create_admin.example.sql`, trocando a senha placeholder antes.

Nao coloque senha real em arquivos versionados.

## Credenciais do Banco

No Supabase, use **Project Settings > Database** para copiar a connection string.

Se a senha tiver caracteres especiais, use a senha codificada para URL na connection string.

Exemplo de `.env` do backend:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:SUA_SENHA_URL_ENCODED@aws-0-REGIAO.pooler.supabase.com:6543/postgres
JWT_SECRET=troque_por_uma_chave_grande_e_aleatoria
JWT_EXPIRES_DAYS=7
MOCK_ADMIN_EMAIL=admin
MOCK_ADMIN_PASSWORD=troque-esta-senha
```

## Validacao

Depois de rodar os SQLs, confira no Table Editor:

- `admins`
- `clientes`
- `catalogo_itens`
- `config_sistema`
- `resgates`
- `pontos_historico`
- `cortes`

## Proximo Passo

Adaptar o backend para usar `DATABASE_URL`/Postgres em vez de `mock_data.py`.

## Deploy rapido do backend no Render

1. Acesse https://render.com.
2. Crie um **Web Service** conectado ao repositorio GitHub.
3. Configure:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_DAYS=7`
5. Depois do deploy, use a URL HTTPS gerada pelo Render como `EXPO_PUBLIC_API_URL`.
