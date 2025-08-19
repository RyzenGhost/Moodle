import React, { useEffect, useState } from "react";
import { Container, Form, Button, Table, Spinner, Alert } from "react-bootstrap";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

export default function Enrollments() {
  const { user } = useAuth();
  const isManager = user && (user.role === "TEACHER" || user.role === "ADMIN");

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchAll = async () => {
    try {
      setLoadingAll(true);
      setError("");
      // Todas estas rutas requieren token y rol -> usa api()
      const [u, c, e] = await Promise.all([
        api("/users"),
        api("/courses"),
        api("/enrollments"),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setCourses(Array.isArray(c) ? c : []);
      setEnrollments(Array.isArray(e) ? e : []);
    } catch (er) {
      setError(er.message || "Error al obtener datos");
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    if (isManager) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager]);

  const onEnroll = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api("/enrollments", {
        method: "POST",
        body: { userId, courseId },
      });
      setMessage("Inscripción creada");
      setUserId("");
      setCourseId("");
      fetchAll();
    } catch (e) {
      setError(e.message || "No se pudo inscribir");
    } finally {
      setLoading(false);
    }
  };

  const onUnenroll = async (uId, cId) => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api("/enrollments", {
        method: "DELETE",
        body: { userId: uId, courseId: cId },
      });
      setMessage("Inscripción eliminada");
      fetchAll();
    } catch (e) {
      setError(e.message || "No se pudo desinscribir");
    } finally {
      setLoading(false);
    }
  };

  if (!isManager) {
    return (
      <Container className="my-5">
        <Alert variant="warning">No autorizado.</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h2>Inscripciones</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Form onSubmit={onEnroll} className="mb-4">
        <Form.Group className="mb-2">
          <Form.Label>Usuario</Form.Label>
          <Form.Select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          >
            <option value="">Selecciona usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.email})
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Curso</Form.Label>
          <Form.Select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
          >
            <option value="">Selecciona curso</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Button type="submit" disabled={loading}>
          {loading ? "Procesando..." : "Inscribir"}
        </Button>
      </Form>

      <h4>Listado</h4>
      {loadingAll ? (
        <Spinner />
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Curso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={`${e.userId}-${e.courseId}`}>
                <td>
                  {e.user?.fullName} ({e.user?.email})
                </td>
                <td>{e.course?.name}</td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onUnenroll(e.userId, e.courseId)}
                  >
                    Quitar
                  </Button>
                </td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center">
                  No hay inscripciones.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
}




