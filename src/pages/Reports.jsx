import React, { useEffect, useState } from "react";
import { Button, Form, Table, Spinner } from "react-bootstrap";
import { api, API_BASE } from "../api/http";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import CardPanel from "../components/CardPanel";
import EmptyState from "../components/EmptyState";

export default function Reports() {
  const { token, user } = useAuth();
  const isManager = user && (user.role === "TEACHER" || user.role === "ADMIN");

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupBy, setGroupBy] = useState("student");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/courses");
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (!isManager) {
    return <CardPanel><div className="text-warning">No autorizado.</div></CardPanel>;
  }

  const buildQuery = () => {
    const q = new URLSearchParams();
    if (courseId) q.set("courseId", courseId);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return q.toString();
  };

  const downloadCSV = async () => {
    try {
      setErr("");
      const q = buildQuery();
      const url = `${API_BASE}/reports/attendance?${q}${q ? "&" : ""}format=csv`;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `asistencias_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setErr(e.message || "No se pudo descargar el CSV");
    }
  };

  const loadSummary = async () => {
    try {
      setLoading(true);
      setErr("");
      const q = new URLSearchParams();
      if (courseId) q.set("courseId", courseId);
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      q.set("groupBy", groupBy);
      const data = await api(`/reports/summary?${q.toString()}`);
      setSummary(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Error cargando resumen");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCourseId(""); setFrom(""); setTo(""); setSummary([]);
  };

  return (
    <>
      <PageHeader
        title={<><i className="bi bi-graph-up" /> Reportes</>}
        subtitle="Explora la asistencia por curso o por alumno"
        actions={<Button onClick={downloadCSV}><i className="bi bi-filetype-csv" /> Descargar CSV</Button>}
      />

      {err && (
        <CardPanel className="mb-3">
          <div className="text-danger">{err}</div>
        </CardPanel>
      )}

      {/* Filtros */}
      <CardPanel className="mb-4">
        <div className="toolbar">
          <Form.Select value={courseId} onChange={(e)=>setCourseId(e.target.value)} style={{ minWidth: 220 }}>
            <option value="">Todos los cursos</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Form.Select>

          <Form.Control type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          <Form.Control type="date" value={to} onChange={e=>setTo(e.target.value)} />

          <Form.Select value={groupBy} onChange={e=>setGroupBy(e.target.value)} style={{ minWidth: 200 }}>
            <option value="student">Resumen por alumno</option>
            <option value="course">Resumen por curso</option>
          </Form.Select>

          <div className="ms-auto d-flex gap-2">
            <Button variant="outline-secondary" onClick={reset}>
              <i className="bi bi-eraser" /> Limpiar
            </Button>
            <Button onClick={loadSummary} disabled={loading}>
              {loading ? <><Spinner size="sm" className="me-1" /> Cargando…</> : <><i className="bi bi-eye" /> Ver resumen</>}
            </Button>
          </div>
        </div>
      </CardPanel>

      {/* Resultados */}
      <CardPanel>
        {loading ? (
          <div className="text-center py-4"><Spinner /></div>
        ) : summary.length === 0 ? (
          <EmptyState title="Sin datos" subtitle="Ajusta los filtros y vuelve a consultar" />
        ) : (
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead>
                {groupBy === "student" ? (
                  <tr>
                    <th>Alumno</th><th>Email</th><th>Total</th><th>Presentes</th><th>Ausentes</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Curso</th><th>Total</th><th>Presentes</th><th>Ausentes</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {summary.map((r, i) =>
                  groupBy === "student" ? (
                    <tr key={r.userId || i}>
                      <td>{r.user}</td>
                      <td className="text-muted">{r.email}</td>
                      <td>{r.total}</td>
                      <td className="text-success">{r.present}</td>
                      <td className="text-danger">{r.absent}</td>
                    </tr>
                  ) : (
                    <tr key={r.courseId || i}>
                      <td>{r.course}</td>
                      <td>{r.total}</td>
                      <td className="text-success">{r.present}</td>
                      <td className="text-danger">{r.absent}</td>
                    </tr>
                  )
                )}
              </tbody>
            </Table>
          </div>
        )}
      </CardPanel>
    </>
  );
}

