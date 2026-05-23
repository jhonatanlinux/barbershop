# Corte Fino

Aplicativo mobile para barbearia com sistema de clientes, pontos, resgates, planos mensalistas e painel administrativo.

O projeto e composto por um app Expo/React Native, uma API FastAPI e um banco PostgreSQL hospedado no Supabase. O deploy do backend pode ser feito no Render, e o APK Android e gerado automaticamente via GitHub Actions usando EAS Build.

## Stack

### Mobile

- Expo SDK 54
- React 19
- React Native 0.81
- React Navigation
- Axios
- Expo Secure Store
- EAS Build para APK Android

### Backend

- Python 3.12
- FastAPI
- Uvicorn
- Pydantic
- python-jose para JWT
- passlib/bcrypt para senhas
- psycopg 3 para PostgreSQL
- python-dotenv para variaveis locais

### Banco de dados

- Supabase
- PostgreSQL
- SQL versionado em `docs/`
- Tabelas para clientes, admins, catalogo, cortes, resgates, historico de pontos e configuracoes
- Permissao administrativa vinculada ao CPF do cliente

### Deploy e CI/CD

- Render para hospedar a API
- GitHub Actions para build automatico do APK
- Expo EAS para compilar Android
- Versionamento automatico do APK nos builds do GitHub Actions

## Estrutura

```text
barbershop/
|-- .github/workflows/        # Automacoes do GitHub Actions
|-- assets/                   # Imagens e icones do app
|-- backend/                  # API FastAPI
|-- docs/                     # SQL, migrations e guias de setup
|-- scripts/                  # Scripts auxiliares de build/versionamento
|-- src/                      # Codigo do app mobile
|-- App.js                    # Entrada do app Expo
|-- app.json                  # Configuracao Expo
|-- eas.json                  # Perfis de build EAS
|-- package.json              # Dependencias e scripts do app
`-- render.yaml               # Blueprint do Render
```

## Como rodar o app

Instale as dependencias:

```bash
npm install
```

Inicie o Expo:

```bash
npm start
```

Para apontar o app para outra API em desenvolvimento:

```bash
EXPO_PUBLIC_API_URL=http://SEU_IP_OU_DOMINIO:8000 npm start
```

No Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL="http://SEU_IP_OU_DOMINIO:8000"
npm start
```

## Como rodar o backend

Entre na pasta da API:

```bash
cd backend
```

Crie e ative um ambiente virtual, se ainda nao existir:

```bash
python -m venv venv
```

No Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Instale as dependencias:

```bash
pip install -r requirements.txt
```

Crie um arquivo `.env` local usando `backend/.env.example` como referencia. Nao versionar `.env`.

Rode a API:

```bash
uvicorn main:app --reload
```

## Variaveis de ambiente

### Backend

Configure no `.env` local e tambem no provedor de deploy:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:PORTA/BANCO
JWT_SECRET=troque_por_uma_chave_forte
JWT_EXPIRES_DAYS=7
```

### App mobile

Configure a URL publica da API:

```env
EXPO_PUBLIC_API_URL=https://sua-api-publica.exemplo.com
```

Nunca coloque senhas, tokens privados, connection strings reais ou chaves secretas dentro do app mobile.

## Banco de dados

Os scripts SQL ficam em `docs/`.

Ordem recomendada para preparar um ambiente novo:

1. Criar o projeto no Supabase.
2. Executar o schema principal em `docs/schema.sql`.
3. Executar migrations em `docs/migrations/`, quando existirem.
4. Criar o primeiro superadmin usando uma copia local do exemplo em `docs/create_superadmin.example.sql`.
5. Configurar `DATABASE_URL` no backend.
6. Testar `/health` e login antes de entregar APK ao cliente.

Senhas reais, CPFs reais e tokens nunca devem ser salvos nos arquivos versionados.

## Permissao admin

O acesso administrativo segue uma regra de negocio por CPF:

- O cliente precisa existir na tabela de clientes.
- O CPF autorizado recebe permissao em `admin_permissoes`.
- A senha fica armazenada como hash.
- O primeiro superadmin deve ser criado manualmente no banco.
- Depois, o superadmin pode autorizar outros CPFs pelo backend/app.

## Deploy do backend

O arquivo `render.yaml` descreve o servico web da API.

Variaveis esperadas no ambiente de producao:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_DAYS`
- `PYTHON_VERSION`

Depois do deploy, use a URL HTTPS gerada pelo provedor como `EXPO_PUBLIC_API_URL` no app e nos builds do EAS.

## Build do APK

Build local com EAS:

```bash
npm run build:apk
```

Build automatico:

- Todo push na branch `main` dispara o workflow de APK.
- O GitHub Actions roda `npm run version:build`.
- O script ajusta a versao do app e o `android.versionCode`.
- O EAS gera um APK novo para distribuicao interna.

O APK novo nao atualiza automaticamente celulares fora da Play Store. O cliente precisa instalar o novo arquivo por cima do anterior.

## Versionamento

A versao base atual fica em:

- `app.json`
- `package.json`

Nos builds do GitHub Actions, o script `scripts/prepare-build-version.js` usa o numero da execucao para gerar uma versao unica e um `versionCode` crescente.

O rodape do app exibe a versao e o credito de desenvolvimento configurados em `src/config/appVersion.js`.

## Seguranca

- Nao versionar `.env`.
- Nao colocar senha de admin no README.
- Nao colocar senha do banco no codigo.
- Nao colocar chaves secretas do Supabase ou service keys no app Expo.
- Usar JWT secret forte em producao.
- Rotacionar qualquer token que tenha sido compartilhado fora de ambiente seguro.
- Criar admins por CPF e senha com hash, nunca por senha fixa no app.

## Commits

Este repositorio usa um template local de commit em `.gitmessage`.

Para abrir o template:

```bash
git commit
```

Para mudancas importantes, documente:

- Problema
- Correcao
- Impacto
- Cuidados

Evite colocar dados pessoais ou segredos em mensagens de commit.
