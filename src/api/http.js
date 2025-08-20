// src/api/http.js

// En desarrollo usamos la URL local (si está definida), en producción SIEMPRE /api
const DEV_BASE =
  (import.meta?.env?.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const API_BASE = import.meta.env.DEV ? DEV_BASE : '/api';

export async function api(path, opts = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const token = localStorage.getItem('auth.token') || '';
  const headers = {
    ...(opts.headers || {})
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Si mandas body (objeto), por defecto es JSON
  let body = opts.body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const resp = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body
  });

  // Intenta parsear JSON; si no es JSON, devuelve texto
  const text = await resp.text();
  let data;
  try { data = text ? JSON.parse(text) : null; }
  catch { data = text; }

  if (!resp.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return data;
}

// helper opcional (solo para quien lo use)
export function setAuthToken(token) {
  if (token) localStorage.setItem('auth.token', token);
  else localStorage.removeItem('auth.token');
}







