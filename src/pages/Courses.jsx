import React, { useState, useEffect } from "react";
import { Form, Button, Alert, Spinner, Table } from "react-bootstrap";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import CardPanel from "../components/CardPanel";
import { toIsoPreservingLocal } from "../utils/time";

const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canManage = user && (user.role === "TEACHER" || user.role === "ADMIN");

  async function fetchCourses() {
    try {
      setLoadingCourses(true);
      setError("");
      const data = await api("/courses");
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Error al obtener cursos");
    } finally {
      setLoadingCourses(false);
    }
  }

  useEffect(() => { fetchCourses(); }, []);

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");

    const today = new Date().toISOString().slice(0,10); // yyyy-mm-dd

    const payload = {
      name,
      description,
      dayOfWeek: Number(dayOfWeek),
      startTime: toIsoPreservingLocal(today, startTime),
      endTime: toIsoPreservingLocal(today, endTime),
    };

    try {
      await api("/courses", { method: "POST", body: payload });
      await fetchCourses();
      setMessage("¡Curso creado con éxito!");
      setName(""); setDescription(""); setDayOfWeek(""); setStartTime(""); setEndTime("");
    } catch (e) {
      setError(e.message || "Error al crear el curso");
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <PageHeader
        title="Gestión de Cursos"
        subtitle={canManage ? "Crea y administra cursos" : "Cursos en los que estás inscrito"}
      />

      {canManage && (
        <CardPanel className="mb-4">
          <Form onSubmit={handleCourseSubmit}>
            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="row g-3">
              <div className="col-12">
                <Form.Label>Nombre del Curso</Form.Label>
                <Form.Control value={name} onChange={e=>setName(e.target.value)} required />
              </div>

              <div className="col-12">
                <Form.Label>Descripción</Form.Label>
                <Form.Control as="textarea" rows={3} value={description} onChange={e=>setDescription(e.target.value)} />
              </div>

              <div className="col-md-4">
                <Form.Label>Día de la semana</Form.Label>
                <Form.Select value={dayOfWeek} onChange={e=>setDayOfWeek(e.target.value)} required>
                  <option value="">Selecciona un día</option>
                  {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </Form.Select>
              </div>

              <div className="col-md-4">
                <Form.Label>Hora de inicio</Form.Label>
                <Form.Control type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} required />
              </div>

              <div className="col-md-4">
                <Form.Label>Hora de finalización</Form.Label>
                <Form.Control type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} required />
              </div>

              <div className="col-12">
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : "Crear Curso"}
                </Button>
              </div>
            </div>
          </Form>
        </CardPanel>
      )}

      <CardPanel>
        <h5 className="mb-3">Cursos Registrados</h5>
        {loadingCourses ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : (
          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Día</th>
                  <th>Horario</th>
                </tr>
              </thead>
              <tbody>
                {courses.length ? courses.map((course) => (
                  <tr key={course.id}>
                    <td style={{maxWidth:220}} className="text-truncate">{course.id}</td>
                    <td>{course.name}</td>
                    <td>{course.description}</td>
                    <td>{days[course.dayOfWeek]}</td>
                    <td>
                      {new Date(course.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                      {new Date(course.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="text-center">No hay cursos.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </CardPanel>
    </div>
  );
}


