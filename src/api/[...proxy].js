// api/[...proxy].js
/* eslint-env node */
import { Buffer } from "node:buffer";
import process from "node:process";

export const config = {
  runtime: "nodejs18.x",
};

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export default async function handler(req, res) {
  const backend = (process.env.BACKEND_URL || "").replace(/\/+$/, "");
  if (!backend) {
    res.status(500).json({ error: "BACKEND_URL no configurado en Vercel" });
    return;
  }

  // Construye URL destino
  const suffix = req.url.replace(/^\/api/, "");
  const targetUrl = backend + (suffix || "/");

  // Clona headers y limpia hop-by-hop
  const outHeaders = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) outHeaders[k] = v;
  }
  // Forzamos Host del destino
  outHeaders.host = new URL(backend).host;

  const method = req.method || "GET";
  const body = ["GET", "HEAD"].includes(method) ? undefined : await readBody(req);

  const response = await fetch(targetUrl, {
    method,
    headers: outHeaders,
    body,
  });

  // Pasa headers de vuelta, filtrando hop-by-hop
  for (const [k, v] of response.headers.entries()) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) res.setHeader(k, v);
  }

  res.status(response.status);
  const buff = Buffer.from(await response.arrayBuffer());
  res.end(buff);
}
