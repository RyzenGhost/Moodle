// src/pages/Sessions.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Container, Form, Button, Table, Spinner, Alert, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import CardPanel from "../components/CardPanel";
import EmptyState from "../components/EmptyState";

/** Convierte fecha/hora local a ISO "Z" preservando la hora local */
function toIsoPreservingLocal(dateStr, timeStr = "00:00") {
  const local = new Date(`${dateStr}T${timeStr}:00`);
  const fixed = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  return fixed.toISOString();
}

export default function Sessions() {
  const { user } = useAuth();
  const isManager = user && (user.role === "TEACHER" || user.role === "ADMIN");

  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);

  // crear
  const [courseId, setCourseId] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  // editar
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // QR
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrExpires, setQrExpires] = useState(300);

  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchAll = async () => {
    try {
      setLoadingAll(true);
      setError("");
      const [c, s] = await Promise.all([api("/courses"), api("/sessions")]);
      setCourses(Array.isArray(c) ? c : []);
      setSessions(Array.isArray(s) ? s : []);
    } catch (e) {
      setError(e.message || "Error al cargar datos");
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Crear
  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const startISO = toIsoPreservingLocal(sessionDate, startAt);
      const endISO   = toIsoPreservingLocal(sessionDate, endAt);
      const sessionDateISO = toIsoPreservingLocal(sessionDate, "00:00");

      await api("/sessions", {
        method: "POST",
        body: { courseId, sessionDate: sessionDateISO, startAt: startISO, endAt: endISO },
      });

      setMessage("Sesión creada ✅");
      setCourseId(""); setSessionDate(""); setStartAt(""); setEndAt("");
      fetchAll();
    } catch (e) {
      setError(e.message || "Error al crear sesión");
    } finally { setLoading(false); }
  };

  // Abrir modal editar
  const openEdit = (s) => {
    setEditId(s.id);
    const d = new Date(s.sessionDate);
    const st = new Date(s.startAt);
    const en = new Date(s.endAt);
    const pad = (n) => String(n).padStart(2, "0");

    setEditDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setEditStart(`${pad(st.getHours())}:${pad(st.getMinutes())}`);
    setEditEnd(`${pad(en.getHours())}:${pad(en.getMinutes())}`);
    setEditOpen(true);
  };

  // Guardar edición
  const onUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const startISO = toIsoPreservingLocal(editDate, editStart);
      const endISO   = toIsoPreservingLocal(editDate, editEnd);
      const sessionDateISO = toIsoPreservingLocal(editDate, "00:00");

      await api(`/sessions/${editId}`, {
        method: "PUT",
        body: { sessionDate: sessionDateISO, startAt: startISO, endAt: endISO },
      });

      setMessage("Sesión actualizada ✅");
      setEditOpen(false);
      fetchAll();
    } catch (e) {
      setError(e.message || "Error al actualizar");
    } finally { setLoading(false); }
  };

  // Eliminar
  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer.")) return;
    setLoading(true); setError(""); setMessage("");
    try {
      await api(`/sessions/${id}`, { method: "DELETE" });
      setMessage("Sesión eliminada ✅");
      fetchAll();
    } catch (e) {
      setError(e.message || "Error al eliminar");
    } finally { setLoading(false); }
  };

  // Generar QR
  const openQr = async (s) => {
    try {
      setError("");
      let data;
      try { data = await api(`/sessions/${s.id}/qr`, { method: "POST" }); }
      catch { data = await api(`/sessions/${s.id}/qr`); }

      const url = data?.url || (data?.token ? `${window.location.origin}/qr-checkin?t=${encodeURIComponent(data.token)}` : "");
      if (!url) throw new Error("Respuesta inválida del servidor");
      setQrUrl(url);
      setQrExpires(300);
      setQrOpen(true);
    } catch (e) {
      setError(e.message || "No se pudo generar el QR");
    }
  };

  // contador visual del QR
  useEffect(() => {
    if (!qrOpen) return;
    const t = setInterval(() => setQrExpires((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [qrOpen]);

  const courseById = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [courses]);

  return (
    <div className="page">

      <PageHeader
        title={<><i className="bi bi-calendar2-week" /> Sesiones</>}
        subtitle="Crea, edita y gestiona sesiones por curso"
        actions={
          isManager && (
            <Button variant="primary" className="icon-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <i className="bi bi-plus-circle" /> Nueva sesión
            </Button>
          )
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      {/* Formulario (solo TEACHER/ADMIN) */}
      {isManager && (
        <CardPanel className="mb-4">
          <Form onSubmit={onCreate}>
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Label>Curso</Form.Label>
                <Form.Select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                  <option value="">Selecciona un curso</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control type="date" value={sessionDate} onChange={(e)=>setSessionDate(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <Form.Label>Inicio</Form.Label>
                <Form.Control type="time" value={startAt} onChange={(e)=>setStartAt(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <Form.Label>Fin</Form.Label>
                <Form.Control type="time" value={endAt} onChange={(e)=>setEndAt(e.target.value)} required />
              </div>
              <div className="col-md-1 d-flex align-items-end">
                <Button type="submit" className="w-100" disabled={loading}>{loading ? "..." : "Crear"}</Button>
              </div>
            </div>
          </Form>
        </CardPanel>
      )}

      <CardPanel>
        {loadingAll ? (
          <div className="text-center py-4"><Spinner /></div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="bi-calendar2-plus"
            title="Sin sesiones"
            subtitle="Crea tu primera sesión para este curso"
            action={isManager && <Button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>Crear sesión</Button>}
          />
        ) : (
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Fecha</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Asistencias</th>
                  {isManager && <th style={{ width: 260 }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const courseName = s.course?.name || courseById.get(s.courseId) || "—";
                  return (
                    <tr key={s.id}>
                      <td>{courseName}</td>
                      <td>{new Date(s.sessionDate).toLocaleDateString()}</td>
                      <td>{new Date(s.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td>{new Date(s.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td>{s.attendance?.length ?? 0}</td>
                      {isManager && (
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <Button as={Link} to={`/sessions/${s.id}`} size="sm" variant="outline-primary">Ver</Button>
                            <Button size="sm" variant="outline-secondary" onClick={() => openEdit(s)}>Editar</Button>
                            <Button size="sm" variant="outline-danger" onClick={() => onDelete(s.id)}>Eliminar</Button>
                            <Button size="sm" variant="success" onClick={() => openQr(s)}>QR</Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </CardPanel>

      {/* Modal Editar */}
      <Modal show={editOpen} onHide={() => setEditOpen(false)}>
        <Form onSubmit={onUpdate}>
          <Modal.Header closeButton><Modal.Title>Editar sesión</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Fecha</Form.Label>
              <Form.Control type="date" value={editDate} onChange={(e)=>setEditDate(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Inicio</Form.Label>
              <Form.Control type="time" value={editStart} onChange={(e)=>setEditStart(e.target.value)} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Fin</Form.Label>
              <Form.Control type="time" value={editEnd} onChange={(e)=>setEditEnd(e.target.value)} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal QR */}
      <Modal show={qrOpen} onHide={() => setQrOpen(false)} centered>
        <Modal.Header closeButton><Modal.Title>QR de asistencia</Modal.Title></Modal.Header>
        <Modal.Body className="text-center">
          {qrUrl ? (
            <>
              <div className="d-flex justify-content-center mb-3">
                <QRCode value={qrUrl} size={220} />
              </div>
              <div className="small text-muted">Expira en <strong>{qrExpires}s</strong></div>
              <div className="mt-2">URL: <code style={{ wordBreak: "break-all" }}>{qrUrl}</code></div>
            </>
          ) : <Spinner />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setQrOpen(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}








