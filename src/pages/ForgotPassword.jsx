import React, { useState } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { api } from "../api/http";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api("/auth/request-password-reset", { method: "POST", body: { email } });
      setOk(true);         // siempre OK para no filtrar si el email existe
    } catch (e) {
      console.error(e);
      setOk(true);         // mismo comportamiento
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Restablecer contraseña</Card.Title>
        {ok ? (
          <Alert variant="success">
            Si el email existe, te enviamos un enlace para restablecer la contraseña. Revisa tu bandeja.
          </Alert>
        ) : (
          <>
            {err && <Alert variant="danger">{err}</Alert>}
            <Form onSubmit={onSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : "Enviar enlace"}
              </Button>
            </Form>
          </>
        )}
      </Card.Body>
    </Card>
  );
}


