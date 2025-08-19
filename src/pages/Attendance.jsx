import React, { useState, useEffect } from "react";
import { Form, Button, Table, Alert, Spinner } from "react-bootstrap";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import CardPanel from "../components/CardPanel";

export default function Attendance() {
  const { user } = useAuth();
  const isTeacher = user && (user.role === "TEACHER" || user.role === "ADMIN");
  const isStudent = user && user.role === "STUDENT";

  const [userEmail, setUserEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      setError("");
      const data = await api("/sessions");
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Error al obtener sesiones");
    } finally {
      setLoadingSessions(false);
    }
  };

  // Para PROFESOR: sacamos asistencia desde /sessions/:id (endpoint existente)
  const fetchAttendanceRecords = async (sid) => {
    try {
      setLoadingRecords(true);
      setError("");

      if (isTeacher) {
        if (!sid) { setAttendanceRecords([]); return; }
        const session = await api(`/sessions/${sid}`);
        setAttendanceRecords(Array.isArray(session?.attendance) ? session.attendance : []);
      } else if (isStudent) {
        const data = await api("/attendance/mine");
        setAttendanceRecords(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError(e.message || "Error al obtener registros");
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    if (isStudent) fetchAttendanceRecords("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(""); setError("");

    try {
      const payload = { sessionId, status: "PRESENT", checkinAt: new Date() };
      if (isTeacher && userEmail) payload.userEmail = userEmail;

      await api("/attendance", { method: "POST", body: payload });

      setMessage("¡Asistencia registrada con éxito!");
      setUserEmail("");

      if (isTeacher) await fetchAttendanceRecords(sessionId);
      else if (isStudent) await fetchAttendanceRecords("");
    } catch (e) {
      setError(e.message || "Error al registrar la asistencia");
    } finally { setLoading(false); }
  };

  const handleSessionIdChange = async (e) => {
    const id = e.target.value;
    setSessionId(id);
    if (isTeacher) await fetchAttendanceRecords(id);
  };

  // Descarga CSV
  const exportAttendanceCSV = () => {
    const headers = ["Alumno","Email","Curso","Fecha de Sesión","Check-in","Estado"];
    const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const rows = attendanceRecords.map(r => [
      r.user?.fullName || "",
      r.user?.email || "",
      r.session?.course?.name || "",
      r.session?.sessionDate ? new Date(r.session.sessionDate).toLocaleDateString() : "",
      r.checkinAt ? new Date(r.checkinAt).toLocaleString() : "",
      r.status || "",
    ]);
    const csv = [headers.map(q).join(","), ...rows.map(r=>r.map(q).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `attendance-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <PageHeader
        title="Registro y Visualización de Asistencia"
        subtitle={isTeacher ? "Marca y revisa asistencias por sesión" : "Tus asistencias"}
      />

      <CardPanel className="mb-4">
        <Form onSubmit={handleAttendanceSubmit}>
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          {isTeacher && (
            <div className="mb-3">
              <Form.Label>Email de Usuario (opcional)</Form.Label>
              <Form.Control
                type="email"
                placeholder="alumno@correo.com (vacío para marcarte a ti)"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
          )}

          <div className="mb-3">
            <Form.Label>Selecciona una Sesión</Form.Label>
            <Form.Select value={sessionId} onChange={handleSessionIdChange} required>
              <option value="">Selecciona una sesión</option>
              {loadingSessions
                ? <option disabled>Cargando sesiones...</option>
                : sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.course?.name} - {new Date(s.sessionDate).toLocaleDateString()}
                    </option>
                  ))}
            </Form.Select>
          </div>

          <Button variant="primary" type="submit" disabled={loading || !sessionId}>
            {loading ? <Spinner animation="border" size="sm" /> : "Marcar Asistencia"}
          </Button>

          {isTeacher && (
            <Button
              variant="outline-secondary"
              type="button"
              className="ms-2"
              disabled={!attendanceRecords?.length}
              onClick={exportAttendanceCSV}
            >
              Exportar CSV
            </Button>
          )}
        </Form>
      </CardPanel>

      <CardPanel>
        <h5 className="mb-3">Registros de Asistencia</h5>
        {loadingRecords ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : (
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead>
                <tr>
                  {isTeacher ? <>
                    <th>Alumno</th><th>Email</th><th>Estado</th><th>Fecha y Hora</th>
                  </> : <>
                    <th>Curso</th><th>Fecha de Sesión</th><th>Estado</th><th>Check-in</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length ? attendanceRecords.map((r) => (
                  <tr key={r.id}>
                    {isTeacher ? <>
                      <td>{r.user?.fullName || "—"}</td>
                      <td>{r.user?.email || "—"}</td>
                      <td>{r.status}</td>
                      <td>{new Date(r.checkinAt).toLocaleString()}</td>
                    </> : <>
                      <td>{r.session?.course?.name || "—"}</td>
                      <td>{r.session?.sessionDate ? new Date(r.session.sessionDate).toLocaleDateString() : "—"}</td>
                      <td>{r.status}</td>
                      <td>{new Date(r.checkinAt).toLocaleString()}</td>
                    </>}
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center">Sin registros.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </CardPanel>
    </div>
  );
}

