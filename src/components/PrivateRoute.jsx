import React from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

/**
 * Uso:
 * <PrivateRoute>
 *   <TuPagina />
 * </PrivateRoute>
 *
 * Con roles:
 * <PrivateRoute roles={["TEACHER","ADMIN"]}>
 *   <SoloStaff />
 * </PrivateRoute>
 */
export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles?.length && !roles.includes(user.role)) {
    // No autorizado: puedes redirigir o mostrar un 403 simple
    return <Navigate to="/" replace />;
  }

  return children;
}


