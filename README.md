# Corte Fino

Aplicativo mobile Expo/React Native com API FastAPI mock para sistema de pontos, resgates e planos mensalistas de barbearia.

## Estrutura

```text
barbershop/
├── App.js
├── src/        # App mobile
├── assets/     # Assets usados pelo app
├── backend/    # API FastAPI mock
├── docs/       # SQL e setup
└── package.json
```

## App

```bash
npm install
npm start
```

Para apontar para outra API:

```bash
EXPO_PUBLIC_API_URL=http://SEU_IP:8000 npm start
```

## Backend

```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload
```

Credenciais mock:

- Cliente: CPF `042.325.951-20`
- Admin: configure a credencial no backend antes de rodar em ambiente real.
