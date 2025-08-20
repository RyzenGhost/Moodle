// /api/[...path].js  — Vercel Edge Function proxy

export const config = { runtime: "edge" };

// Cabeceras hop‑by‑hop que no deben reenviarse
const HOP_BY_HOP = new Set([
  "connection","keep-alive","proxy-authenticate","proxy-authorization",
  "te","trailer","transfer-encoding","upgrade"
]);

function copyHeaders(from) {
  const out = new Headers();
  for (const [k, v] of from.entries()) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) out.set(k, v);
  }
  return out;
}

export default async function handler(req) {
  // lee BACKEND_URL de variables de entorno de Vercel
  /* eslint-env node */

  const backend = (process.env.BACKEND_URL || "").replace(/\/+$/, "");
  if (!backend) {
    return new Response(JSON.stringify({ error: "BACKEND_URL no config" }),
      { status: 500, headers: { "content-type": "application/json" } });
  }

  // Soporte CORS preflight (por si el navegador lo envía)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "authorization, content-type"
      }
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/?/, ""); // quita /api/
  const targetUrl = `${backend}/${path}${url.search}`;

  // cuerpo (solo si el método lo permite)
  let body = undefined;
  if (!["GET","HEAD"].includes(req.method)) {
    body = await req.arrayBuffer();
  }

  // Reenvía al backend
  const resp = await fetch(targetUrl, {
    method: req.method,
    headers: copyHeaders(req.headers),
    body,
    redirect: "manual"
  });

  const headers = copyHeaders(resp.headers);
  // si quieres forzar mismo-origen, puedes añadir:
  // headers.set("access-control-allow-origin", "*");

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers
  });
}
