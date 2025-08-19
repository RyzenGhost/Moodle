// src/pages/NotFound.jsx
import React from "react";
import { Alert } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Alert variant="secondary" className="my-5">
      <h4>404 — Página no encontrada</h4>
      <p>La ruta a la que intentas acceder no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </Alert>
  );
}
