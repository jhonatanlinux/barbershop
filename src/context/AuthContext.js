import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import {
  getConfig,
  getMe,
  loginAdmin as apiLoginAdmin,
  loginCliente as apiLoginCliente,
} from "../api";
const TOKEN_KEY = "token";
const AuthContext = createContext(null);
export const CONFIG_DEFAULT = {
  modulo_mensalista: true,
  modulo_catalogo: true,
  validacao_cpf: true,
  limite_solicitacoes: 2,
  pontos_por_corte: 10,
  pontos_mensalista: 3,
  nome_barbearia: "Corte Fino",
  preco_mensalista: 150,
  preco_mensalista_sem_barba: 100,
  preco_mensalista_so_barba: 80,
  dias_plano: 30,
};
function parseConfigValue(value, type) {
  if (type === "boolean") {
    return value === true || value === "true";
  }
  if (type === "integer") {
    return Number(value);
  }
  return value;
}
function normalizeConfig(configResponse) {
  const entries = Array.isArray(configResponse)
    ? configResponse.map((item) => [item.chave, item.valor, item.tipo])
    : Object.entries(configResponse || {}).map(([key, value]) => [
        key,
        value?.valor ?? value,
        value?.tipo ?? "string",
      ]);
  return entries.reduce((config, [key, value, type]) => {
    if (!key) return config;
    return { ...config, [key]: parseConfigValue(value, type) };
  }, {});
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(CONFIG_DEFAULT);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const [me, remoteConfig] = await Promise.all([
          token ? getMe() : null,
          getConfig(),
        ]);
        if (!mounted) return;
        if (me) setUser(me);
        setConfig((prev) => ({ ...prev, ...normalizeConfig(remoteConfig) }));
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);
  const loginCliente = useCallback(async (cpf) => {
    const data = await apiLoginCliente(cpf);
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setUser({ tipo: "cliente", cpf, nome: data.nome, pontos: data.pontos });
    return data;
  }, []);
  const loginAdmin = useCallback(async (cpf, senha) => {
    const data = await apiLoginAdmin(cpf, senha);
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setUser({ tipo: "admin", cpf: data.cpf, nome: data.nome, role: data.role });
    return data;
  }, []);
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  }, []);
  const updatePontos = useCallback((pontos) => {
    setUser((prev) => (prev ? { ...prev, pontos } : prev));
  }, []);
  const value = useMemo(
    () => ({
      user,
      config,
      loading,
      loginCliente,
      loginAdmin,
      logout,
      updatePontos,
      setConfig,
    }),
    [config, loading, loginAdmin, loginCliente, logout, updatePontos, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
export const useConfig = () =>
  useContext(AuthContext)?.config ?? CONFIG_DEFAULT;
