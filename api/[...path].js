// api/[...path].js
export const config = { runtime: "edge" };

// Cabeceras hop-by-hop que no deben reenviarse
const HOP_BY_HOP = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade"
]);

function copyHeaders(inHeaders) {
  const out = new Headers();
  for (const [k, v] of inHeaders.entries()) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) out.set(k, v);
  }
  return out;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const base = (globalThis.process?.env?.BACKEND_URL || "").replace(/\/+$/, "");
  if (!base) {
    return new Response(JSON.stringify({ error: "BACKEND_URL no está configurada" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // /api/auth/login -> /auth/login
  const upstream = base + url.pathname.replace(/^\/api/, "") + url.search;

  // Clonamos la petición hacia el backend
  const init = {
    method: req.method,
    headers: copyHeaders(req.headers),
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    redirect: "manual",
  };

  const resp = await fetch(upstream, init);

  // Devolvemos la respuesta tal cual (quitando hop-by-hop)
  const headers = copyHeaders(resp.headers);
  // permite leer el body JSON en el front
  if (!headers.has("content-type")) headers.set("content-type", "application/json; charset=utf-8");

  return new Response(resp.body, { status: resp.status, headers });
}
