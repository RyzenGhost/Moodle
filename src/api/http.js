// usa /api relativo -> pasa por el proxy de Vercel
const API_BASE =
  (import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") || "") || "/api";

let AUTH_TOKEN = "";
export function setAuthToken(t) { AUTH_TOKEN = t || ""; }

export async function api(path, { method = "GET", body, headers } = {}) {
  const url = `${API_BASE}${path}`; // p.ej. /api/auth/login
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch {/**/}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export { API_BASE };








