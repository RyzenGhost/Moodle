import React, { useState } from "react";
import { Card, Form, Button, Alert, Row, Col, Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/http";

export default function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const onChangePassword = async (e) => {
    e.preventDefault();
    setOk(""); setErr(""); setLoading(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setOk("Contraseña actualizada correctamente ✅");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      setErr(e.message || "No se pudo actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="g-4">
      <Col md={6}>
        <Card>
          <Card.Body>
            <Card.Title>Mi perfil</Card.Title>
            <div className="mt-3">
              <div><strong>Nombre:</strong> {user?.fullName}</div>
              <div><strong>Email:</strong> {user?.email}</div>
              <div><strong>Rol:</strong> {user?.role}</div>
            </div>
            <small className="text-muted">
              (Edición de nombre/email puede implementarse más adelante)
            </small>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <Card.Body>
            <Card.Title>Cambiar contraseña</Card.Title>
            {ok && <Alert variant="success">{ok}</Alert>}
            {err && <Alert variant="danger">{err}</Alert>}
            <Form onSubmit={onChangePassword}>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña actual</Form.Label>
                <Form.Control
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nueva contraseña</Form.Label>
                <Form.Control
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <Form.Text>Mínimo 8 caracteres.</Form.Text>
              </Form.Group>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" /> : "Actualizar"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

