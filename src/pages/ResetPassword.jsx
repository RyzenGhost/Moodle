import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Form, Button, Container, Alert, Spinner } from "react-bootstrap";
import { api } from "../api/http";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(""); setError("");
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: { token, newPassword },
      });
      setMessage("Contraseña restablecida con éxito ✅");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Error al restablecer contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container style={{ maxWidth: 500 }}>
        <Alert variant="warning">Falta el token en la URL.</Alert>
      </Container>
    );
  }

  return (
    <Container style={{ maxWidth: 500 }}>
      <h3 className="mb-4">Nueva Contraseña</h3>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nueva contraseña</Form.Label>
          <Form.Control
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Restablecer"}
        </Button>
      </Form>
    </Container>
  );
}

