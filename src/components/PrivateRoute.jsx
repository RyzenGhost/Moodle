// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  // Mientras validamos sesión (ej. al refrescar y rehacer /auth/me)
  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  // No logueado
  if (!user) return <Navigate to="/login" replace />;

  // Restringido por rol
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="my-4">
        <Alert variant="warning">
          No tienes permisos para acceder a esta sección.
        </Alert>
      </div>
    );
  }

  return children;
}

