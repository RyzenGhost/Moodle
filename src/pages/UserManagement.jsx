import React, { useState, useEffect } from "react";
import { Container, Form, Button, Table, Alert, Spinner } from "react-bootstrap";
import { api } from "../api/http";                 // <- cliente fetch con Bearer
import { useAuth } from "../context/AuthContext";  // <- saber rol/estado

function UserManagement() {
  const { user } = useAuth();
  const canManage = user && (user.role === "TEACHER" || user.role === "ADMIN");

  const [users, setUsers] = useState([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setError("");
      const data = await api("/users"); // GET protegido (TEACHER/ADMIN)
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (canManage) fetchUsers();
  }, [canManage]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api("/users", {
        method: "POST",
        body: { fullName, email, role }, // POST protegido (TEACHER/ADMIN)
      });
      await fetchUsers();
      setMessage("¡Usuario creado con éxito!");
      setFullName("");
      setEmail("");
      setRole("STUDENT");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          No tienes permisos para gestionar usuarios. Inicia sesión como <b>TEACHER</b> o <b>ADMIN</b>.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4">Gestión de Usuarios</h2>

      <Form onSubmit={handleUserSubmit} className="mb-5">
        <h4>Crear Nuevo Usuario</h4>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label>Nombre Completo</Form.Label>
          <Form.Control
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Rol</Form.Label>
          <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="STUDENT">Estudiante</option>
            <option value="TEACHER">Profesor</option>
            <option value="ADMIN">Admin</option>
          </Form.Select>
        </Form.Group>

        <Button variant="success" type="submit" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Crear Usuario"}
        </Button>
      </Form>

      <h4>Usuarios Registrados</h4>
      {loadingUsers ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default UserManagement;
