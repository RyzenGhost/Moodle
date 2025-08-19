// src/pages/QrScan.jsx
import React, { useState, useRef } from "react";
import { Container, Alert, Button } from "react-bootstrap";
import { Scanner } from "@yudiel/react-qr-scanner"; // 👈 esta es la import correcta
import { useNavigate } from "react-router-dom";

export default function QrScan() {
  const [lastText, setLastText] = useState("");
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const handledRef = useRef(false); // para evitar múltiples redirecciones

  const handleScan = (results) => {
    if (paused || handledRef.current) return;

    const text =
      Array.isArray(results) && results[0] && results[0].rawValue
        ? results[0].rawValue
        : "";

    if (!text) return;

    setLastText(text);
    setPaused(true); // pausa la cámara para no disparar múltiples veces
    handledRef.current = true;

    // Tus QR contienen una URL tipo: http(s)://.../qr-checkin?t=<TOKEN>
    try {
      const url = new URL(text);
      const token =
        url.searchParams.get("t") || url.searchParams.get("token") || "";

      if (token) {
        // redirige a la página de check-in (protegida) con el token
        navigate(`/qr-checkin?t=${encodeURIComponent(token)}`);
      } else {
        // Si el QR no es de tu app, muestra lo leído y permite reintentar
        setError("El QR no contiene un token válido.");
      }
    } catch {
      // No era una URL, solo mostramos el texto
      setError("QR leído, pero no es una URL válida para check-in.");
    }
  };

  const handleError = () => {
    setError("No se pudo acceder a la cámara o leer el QR.");
  };

  const reset = () => {
    setPaused(false);
    handledRef.current = false;
    setError("");
    setLastText("");
  };

  return (
    <Container className="my-4">
      <h3>Escanear QR</h3>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {lastText && !error && (
        <Alert variant="info" className="mt-3">
          Último contenido leído: <code>{lastText}</code>
        </Alert>
      )}

      <div className="my-3" style={{ maxWidth: 480 }}>
        <Scanner
          onScan={handleScan}
          onError={handleError}
          paused={paused}
          constraints={{ facingMode: "environment" }} // cámara trasera en móviles
          styles={{ container: { width: "100%" } }}
        />
      </div>

      <div className="d-flex gap-2">
        <Button variant="secondary" onClick={reset}>
          Reintentar
        </Button>
      </div>
    </Container>
  );
}









