// src/pages/SessionDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Table, Spinner, Alert, Button } from "react-bootstrap";
import { api } from "../api/http";

export default function SessionDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const s = await api(`/sessions/${id}`);
      setData(s);
    } catch (e) {
      setErr(e.message || "Error al cargar sesión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <Container className="my-5"><Spinner /></Container>;
  if (err) return <Container className="my-5"><Alert variant="danger">{err}</Alert></Container>;
  if (!data) return null;

  return (
    <Container className="my-5">
      <h3>Sesión</h3>
      <p>
        <strong>Curso:</strong> {data.course?.name}<br />
        <strong>Fecha:</strong> {new Date(data.sessionDate).toLocaleDateString()}<br />
        <strong>Horario:</strong>{" "}
        {new Date(data.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
        {new Date(data.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>

      <h5>Asistencias</h5>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Check-in</th>
          </tr>
        </thead>
        <tbody>
          {data.attendance?.length ? (
            data.attendance.map((a) => (
              <tr key={a.id}>
                <td>{a.user?.fullName}</td>
                <td>{a.user?.email}</td>
                <td>{a.status}</td>
                <td>{new Date(a.checkinAt).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">Sin registros</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Button as={Link} to="/sessions" variant="secondary">Volver</Button>
    </Container>
  );
}
