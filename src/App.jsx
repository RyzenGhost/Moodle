import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";

import UserManagement from "./pages/UserManagement";
import Attendance from "./pages/Attendance";
import Courses from "./pages/Courses";
import Login from "./pages/Login";
import Enrollments from "./pages/Enrollments";
import Sessions from "./pages/Sessions";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SessionDetail from "./pages/SessionDetail";
import Reports from "./pages/Reports";
import QrScan from "./pages/QrScan";
import QrCheckin from "./pages/QrCheckin";
import AppShell from "./layouts/AppShell";
import Register from "./pages/Register"; // 👈 IMPORTANTE

function Home() {
  return (
    <div>
      <h2>Bienvenido al Sistema de Asistencia</h2>
      <p>Gestiona cursos y asistencia de forma eficiente.</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          {/* públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* 👈 NUEVA RUTA */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* protegidas */}
          <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />

          {/* solo TEACHER/ADMIN */}
          <Route path="/users" element={<PrivateRoute roles={["TEACHER","ADMIN"]}><UserManagement /></PrivateRoute>} />
          <Route path="/enrollments" element={<PrivateRoute roles={["TEACHER","ADMIN"]}><Enrollments /></PrivateRoute>} />
          <Route path="/sessions" element={<PrivateRoute roles={["TEACHER","ADMIN"]}><Sessions /></PrivateRoute>} />
          <Route path="/sessions/:id" element={<PrivateRoute roles={["TEACHER","ADMIN"]}><SessionDetail /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute roles={["TEACHER","ADMIN"]}><Reports /></PrivateRoute>} />

          {/* QR */}
          <Route path="/qr-scan" element={<PrivateRoute><QrScan /></PrivateRoute>} />
          <Route path="/qr-checkin" element={<PrivateRoute><QrCheckin /></PrivateRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </Router>
  );
}





