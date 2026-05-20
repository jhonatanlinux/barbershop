# Barbershop — Guia de Setup Completo

## 1. Supabase (Banco de Dados)

### Criar projeto
1. Acesse https://supabase.com e crie uma conta
2. New Project → nomeie como `barbershop`
3. Defina uma senha forte para o banco
4. Aguarde o setup (~2 min)

### Rodar o schema
1. Supabase Dashboard → **SQL Editor**
2. Cole o conteúdo de `docs/schema.sql` e execute
3. Cole o conteúdo de `docs/seed.sql` e execute
4. Verifique em **Table Editor** se as tabelas foram criadas

### Pegar as credenciais
Em **Settings → API** você vai encontrar:
- **Project URL**: `https://XXXX.supabase.co`
- **anon key**: chave pública (segura para o frontend)
- **service_role key**: chave privada (use APENAS no backend)

---

## 2. Backend FastAPI

### Requisitos
- Python 3.12
- pip

### Setup local
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# ou: source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

### Variáveis de ambiente
Crie `backend/.env`:
```env
USE_MOCK=false
DATABASE_URL=postgresql://postgres:SUASENHA@db.SEUPROJETO.supabase.co:5432/postgres
JWT_SECRET=gere_uma_chave_forte_aqui
JWT_EXPIRES_DAYS=7
PONTOS_POR_CORTE=10
PONTOS_POR_SESSAO_MENSALISTA=3
```

### Rodar localmente
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Deploy com Docker (VPS)
```bash
# No seu VPS
git clone https://github.com/jhonatanlinux/barbershop.git
cd barbershop/backend

# Criar .env com as variáveis de produção
docker build -t barbershop-api .
docker run -d -p 8000:8000 --env-file .env barbershop-api
```

---

## 3. App Expo (Mobile)

### Requisitos
- Node.js 20+
- npm ou yarn
- Expo Go no celular (para testar)
- Conta no Expo (eas.expo.dev) para builds

### Setup
```bash
cd app
npm install
```

### Configurar URL da API
Em `src/api.js`, substitua o IP:
```javascript
export const API_URL = __DEV__
  ? 'http://SEU_IP_LOCAL:8000'   // seu IP na rede local
  : 'https://api.seudominio.com'; // produção
```

Para descobrir seu IP local (Windows):
```
ipconfig → IPv4 Address
```

### Testar com Expo Go
```bash
npx expo start
```
Escaneie o QR Code com o Expo Go no celular.

### Gerar APK (Android)
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login na conta Expo
eas login

# Configurar o projeto
eas build:configure

# Gerar APK de preview (sem Play Store)
eas build --platform android --profile preview
```
O APK será gerado na nuvem (~10 min). Baixe e instale direto no Android.

### Gerar IPA (iOS)
```bash
eas build --platform ios --profile preview
```
Requer conta Apple Developer ($99/ano).

---

## 4. Configurar domínio (VPS + Nginx)

```nginx
server {
    listen 80;
    server_name api.suabarbearia.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# SSL com Let's Encrypt
certbot --nginx -d api.suabarbearia.com
```

---

## 5. Checklist de Produção

- [ ] Schema SQL rodado no Supabase
- [ ] Seed SQL rodado (admin + catálogo)
- [ ] Backend rodando no VPS
- [ ] SSL configurado no domínio
- [ ] API_URL atualizada no app para o domínio de produção
- [ ] APK gerado e testado
- [ ] USE_MOCK=false no backend
- [ ] JWT_SECRET trocado por uma chave forte

---

## Credenciais padrão (trocar em produção!)

| | |
|---|---|
| Admin usuário | `admin` |
| Admin senha | `-1PL&,8!gk>J9Np` |
| CPF de teste | `042.325.951-20` (Carlos Eduardo) |
