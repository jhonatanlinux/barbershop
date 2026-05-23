import axios from "axios";
import * as SecureStore from "expo-secure-store";
const DEFAULT_DEV_URL = "http://192.168.0.101:8000";
const DEFAULT_PROD_URL = "https://api.cortefino.com.br";
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || err.message || "Erro de conexão";
    return Promise.reject(new Error(msg));
  },
);
const get = (url) => api.get(url);
const post = (url, data) => api.post(url, data);
const patch = (url, data) => api.patch(url, data);
const del = (url) => api.delete(url);
export const loginCliente = (cpf) => post("/auth/cliente", { cpf });
export const loginAdmin = (cpf, senha) => post("/auth/admin", { cpf, senha });
export const getMe = () => get("/auth/me");
export const getAdmins = () => get("/auth/admins");
export const salvarAdmin = (data) => post("/auth/admins", data);
export const desativarAdmin = (cpf) => del(`/auth/admins/${cpf}`);
export const getClientes = () => get("/clientes");
export const getCliente = (cpf) => get(`/clientes/${cpf}`);
export const criarCliente = (data) => post("/clientes", data);
export const atualizarCliente = (cpf, data) => patch(`/clientes/${cpf}`, data);
export const removerCliente = (cpf) => del(`/clientes/${cpf}`);
export const lancarCorte = (cpf, tipo = "corte") =>
  post("/cortes", { cpf, tipo_servico: tipo });
export const solicitarResgate = (itemId) =>
  post("/resgates", { item_id: itemId });
export const getResgatesPendentes = () => get("/resgates/pendentes");
export const getResgatesHistorico = () => get("/resgates/historico");
export const autorizarResgate = (id, dataAgenda = null) =>
  patch(`/resgates/${id}/autorizar`, { data_agenda: dataAgenda });
export const recusarResgate = (id) => patch(`/resgates/${id}/recusar`);
export const getCatalogo = () => get("/catalogo");
export const toggleCatalogoItem = (id) => patch(`/catalogo/${id}/toggle`);
export const getMensalistas = () => get("/mensalistas");
export const registrarPagamento = (cpf, data) =>
  post(`/mensalistas/${cpf}/pagamento`, data);
export const getConfig = () => get("/config");
export const setConfig = (chave, valor) => patch("/config", { chave, valor });
export default api;
