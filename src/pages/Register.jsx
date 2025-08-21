import React, { useState } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(fullName, email, password /* , "STUDENT" | "TEACHER" | "ADMIN" */);
      navigate("/"); // si quitaste el auto-login, usa navigate("/login")
    } catch (err) {
      setError(err?.message || "Error al registrarte");
    }
  };

  return (
    <Container className="my-5" style={{ maxWidth: 420 }}>
      <h2 className="mb-4 text-center">Crear cuenta</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nombre completo</Form.Label>
          <Form.Control
            value={fullName}
            onChange={(e)=>setFullName(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Form.Group>
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Registrarme"}
        </Button>
        <p className="mt-3">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </Form>
    </Container>
  );
}




