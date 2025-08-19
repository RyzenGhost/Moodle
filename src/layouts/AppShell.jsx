import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const isManager = user && (user.role === "TEACHER" || user.role === "ADMIN");

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-logo">
          <span style={{ width: 10, height: 10, background: "#0ea5e9", borderRadius: 999 }} />
          <span>Sistema Académico</span>
        </div>

        <nav className="app-nav">
          <NavLink to="/" end>🏠 Inicio</NavLink>
          <NavLink to="/courses">📚 Cursos</NavLink>
          <NavLink to="/attendance">🗓️ Asistencia</NavLink>
          <NavLink to="/sessions">🧾 Sesiones</NavLink>
          <NavLink to="/reports">📊 Reportes</NavLink>

          {isManager && <div className="app-section-label">Administración</div>}
          {isManager && (
            <>
              <NavLink to="/users">👥 Usuarios</NavLink>
              <NavLink to="/enrollments">🧩 Inscripciones</NavLink>
            </>
          )}
        </nav>
      </aside>

      <main className="app-content">
        <header className="app-header">
          {user && (
            <>
              <div style={{ color: "#111827", fontWeight: 600 }}>
                {user.fullName} ({user.role})
              </div>
              <button className="btn btn-outline-secondary btn-sm" onClick={logout}>⏏ Salir</button>
            </>
          )}
        </header>

        {children}
      </main>
    </div>
  );
}


