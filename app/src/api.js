import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ── URL do backend ────────────────────────────────────────
// Desenvolvimento local: use o IP da sua máquina
// Produção: coloque a URL do seu VPS
export const API_URL = __DEV__
  ? 'http://192.168.1.X:8000'   // ← troque pelo IP da sua máquina
  : 'https://api.seudominio.com';

// ── Instância axios ───────────────────────────────────────
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: adicionar token JWT em toda request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: tratar erros globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Erro de conexão';
    return Promise.reject(new Error(msg));
  }
);

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════
export const authAPI = {
  loginCliente: (cpf) =>
    api.post('/auth/cliente', { cpf }),

  loginAdmin: (email, senha) =>
    api.post('/auth/admin', { email, senha }),

  me: () =>
    api.get('/auth/me'),
};

// ══════════════════════════════════════════════════════════
// CLIENTES
// ══════════════════════════════════════════════════════════
export const clientesAPI = {
  listar: () =>
    api.get('/clientes'),

  buscar: (cpf) =>
    api.get(`/clientes/${cpf}`),

  cadastrar: (data) =>
    api.post('/clientes', data),

  atualizar: (cpf, data) =>
    api.patch(`/clientes/${cpf}`, data),
};

// ══════════════════════════════════════════════════════════
// CORTES
// ══════════════════════════════════════════════════════════
export const cortesAPI = {
  lancar: (cpf, tipoServico = 'corte') =>
    api.post('/cortes', { cpf, tipo_servico: tipoServico }),
};

// ══════════════════════════════════════════════════════════
// RESGATES
// ══════════════════════════════════════════════════════════
export const resgatesAPI = {
  solicitar: (itemId) =>
    api.post('/resgates', { item_id: itemId }),

  listarPendentes: () =>
    api.get('/resgates/pendentes'),

  historico: () =>
    api.get('/resgates/historico'),

  autorizar: (id, dataAgenda = null) =>
    api.patch(`/resgates/${id}/autorizar`, { data_agenda: dataAgenda }),

  recusar: (id, motivo = '') =>
    api.patch(`/resgates/${id}/recusar`, { motivo }),
};

// ══════════════════════════════════════════════════════════
// CATÁLOGO
// ══════════════════════════════════════════════════════════
export const catalogoAPI = {
  listar: () =>
    api.get('/catalogo'),

  toggle: (id) =>
    api.patch(`/catalogo/${id}/toggle`),
};

// ══════════════════════════════════════════════════════════
// MENSALISTAS
// ══════════════════════════════════════════════════════════
export const mensalistasAPI = {
  listar: () =>
    api.get('/mensalistas'),

  registrarPagamento: (cpf, data) =>
    api.post(`/mensalistas/${cpf}/pagamento`, data),
};

// ══════════════════════════════════════════════════════════
// CONFIG (Feature Flags)
// ══════════════════════════════════════════════════════════
export const configAPI = {
  listar: () =>
    api.get('/config'),

  atualizar: (chave, valor) =>
    api.patch('/config', { chave, valor }),
};
