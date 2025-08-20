/* eslint-disable react-refresh/only-export-components */
// ^ Evita la advertencia de Fast Refresh por exportar también useAuth

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAuthToken } from "../api/http";

/**
 * @typedef {"STUDENT" | "TEACHER" | "ADMIN"} Role
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} fullName
 * @property {string} email
 * @property {Role} role
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {string|null} token
 * @property {boolean} loading
 */

/**
 * @typedef {AuthState & {
 *   login: (email: string, password: string) => Promise<void>,
 *   register: (payload: { fullName: string, email: string, password: string }) => Promise<void>,
 *   logout: () => void,
 *   refreshMe: () => Promise<void>
 * }} AuthContextType
 */

const LS_KEY = "auth:v1";

/** @returns {AuthState} */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { user: null, token: null, loading: false };
    /** @type {{ user: User|null, token: string|null }} */
    // @ts-ignore - JSDoc para ayuda, pero seguimos en JS
    const parsed = JSON.parse(raw);
    return {
      user: parsed?.user ?? null,
      token: parsed?.token ?? null,
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

/** @type {React.Context<AuthContextType>} */
// @ts-ignore – definimos shape con JSDoc arriba
const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  async login() {},
  async register() {},
  logout() {},
  async refreshMe() {},
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

  /** @type {AuthContextType["login"]} */
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
    } finally {
      setLoading(false);
    }
  };

  /** @type {AuthContextType["register"]} */
  const register = async (payload) => {
    setLoading(true);
    try {
      const resp = await api("/auth/register", {
        method: "POST",
        body: payload,
      });
      setUser(resp.user || null);
      setToken(resp.token || null);
      saveToStorage(resp.user || null, resp.token || null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    saveToStorage(null, null);
    setAuthToken(""); // limpia el Authorization global
  };

  /** @type {AuthContextType["refreshMe"]} */
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

/** Hook de conveniencia */
export const useAuth = () => useContext(AuthContext);




