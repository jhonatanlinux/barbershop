# Barbershop — Sistema de Pontos e Resgates

Sistema completo para barbearia com acúmulo de pontos, catálogo de resgates e planos mensalistas.

## 📁 Estrutura

```
barbershop/
├── index.html          # Protótipo completo (standalone, abre no browser)
├── backend/            # API FastAPI (Python 3.12)
├── app/                # App mobile (Expo React Native)
└── docs/               # Documentação e SQL
```

## 🚀 Testar agora (sem instalação)

Abra o `index.html` diretamente no Chrome.

**Acesso cliente:** CPF `042.325.951-20`  
**Acesso admin:** usuário `admin` / senha `-1PL&,8!gk>J9Np`

## ✅ Funcionalidades

- Cadastro de clientes por CPF
- Acúmulo de pontos por corte (+10 pts regular / +3 pts mensalista)
- Catálogo de resgates com autorização do admin
- 3 planos mensalistas: Completo, Sem Barba, Só Barba (careca)
- Painel admin completo com agenda, relatórios e solicitações
- Dashboard TV com relógio em tempo real
- Sistema de Feature Flags — admin ativa/desativa cada módulo
- Ícones vetoriais SVG em toda a aplicação
- Tema dark premium (Playfair Display + DM Sans)

## 🗺️ Roadmap

- [ ] Banco de dados Supabase (PostgreSQL)
- [ ] Backend FastAPI (Python 3.12)
- [ ] App mobile (Expo React Native — Android + iOS)
- [ ] Persistência localStorage
- [ ] Notificação WhatsApp
- [ ] QR Code do cliente
- [ ] PWA / modo offline

## 🛠️ Stack planejada

| Camada | Tecnologia |
|---|---|
| Protótipo | HTML + CSS + JS (standalone) |
| Backend | FastAPI (Python 3.12) |
| Banco | PostgreSQL via Supabase |
| Mobile | Expo SDK 51 (React Native) |
| Deploy | VPS Linux + Docker |
