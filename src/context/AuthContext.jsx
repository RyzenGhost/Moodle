/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../api/http";

/** @typedef {"STUDENT" | "TEACHER" | "ADMIN"} Role */
/** @typedef {{ id:string, fullName:string, email:string, role:Role }} User */
/** @typedef {{ user:User|null, token:string|null, loading:boolean }} AuthState */

const LS_KEY = "auth:v1";

/** @returns {AuthState} */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { user: null, token: null, loading: false };
    const parsed = JSON.parse(raw);
    return {
      user: parsed && parsed.user ? parsed.user : null,
      token: parsed && parsed.token ? parsed.token : null,
      loading: false,
    };
  } catch {
    return { user: null, token: null, loading: false };
  }
}

/** @param {User|null} user @param {string|null} token */
function saveToStorage(user, token) {
  if (user && token) {
    localStorage.setItem(LS_KEY, JSON.stringify({ user, token }));
  } else {
    localStorage.removeItem(LS_KEY);
  }
}

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshMe: async () => {},
});

export function AuthProvider({ children }) {
  const boot = loadFromStorage();
  const [user, setUser] = useState(boot.user);
  const [token, setToken] = useState(boot.token);
  const [loading, setLoading] = useState(false);

  // Mantener Bearer en el cliente http centralizado
  useEffect(() => {
    setAuthToken(token || "");
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const resp = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setUser(resp.user || null);
      setToken(resp.token || null);
      saveToStorage(resp.user || null, resp.token || null);
      return resp;
    } finally {
      setLoading(false);
    }
  };

  /** Registro + auto-login.
   * Si NO quieres auto-login, comenta setUser/setToken/saveToStorage y
   * maneja la navegación en el componente a /login.
   */
  const register = async (fullName, email, password, role) => {
    setLoading(true);
    try {
      const resp = await api("/auth/register", {
        method: "POST",
        body: { fullName, email, password, role }, // role opcional
      });
      // Auto-login:
      setUser(resp.user || null);
      setToken(resp.token || null);
      saveToStorage(resp.user || null, resp.token || null);
      return resp;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    saveToStorage(null, null);
    setAuthToken("");
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const me = await api("/auth/me");
      setUser(me || null);
      saveToStorage(me || null, token);
    } catch {
      // token inválido/expirado
      logout();
    }
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshMe }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);






