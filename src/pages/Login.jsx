// src/pages/Login.jsx
import React, { useState } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err?.message || "Error al iniciar sesión");
    }
  };

  return (
    <Container className="my-5" style={{ maxWidth: 420 }}>
      <h2 className="mb-4 text-center">Iniciar sesión</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Entrar"}
        </Button>

        <p className="mt-3">
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="text-sm mt-2 text-center">
+   ¿No tienes cuenta?{" "}
+   <Link to="/register" className="text-blue-600 hover:underline">
+     Regístrate aquí
+   </Link>
+ </p>
      </Form>
    </Container>
  );
}



