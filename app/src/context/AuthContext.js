import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { tipo, cpf?, nome, pontos? }
  const [config, setConfig]   = useState({});      // feature flags
  const [loading, setLoading] = useState(true);

  // Restaurar sessão ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const { data } = await authAPI.me();
          setUser(data);
        }
      } catch {
        await SecureStore.deleteItemAsync('token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loginCliente = async (cpf) => {
    const { data } = await authAPI.loginCliente(cpf);
    await SecureStore.setItemAsync('token', data.token);
    setUser({ tipo: 'cliente', cpf, nome: data.nome, pontos: data.pontos });
    return data;
  };

  const loginAdmin = async (email, senha) => {
    const { data } = await authAPI.loginAdmin(email, senha);
    await SecureStore.setItemAsync('token', data.token);
    setUser({ tipo: 'admin', nome: data.nome });
    return data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  const updateUserPontos = (pontos) =>
    setUser(prev => prev ? { ...prev, pontos } : prev);

  return (
    <AuthContext.Provider value={{
      user, config, loading,
      loginCliente, loginAdmin, logout,
      updateUserPontos, setConfig,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
