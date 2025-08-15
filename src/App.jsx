import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import UserManagement from './pages/UserManagement'; // ¡Nueva importación!

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} /> 
        <Route path="/users" element={<UserManagement />} /> {/* ¡Nueva ruta! */}
      </Routes>
    </Router>
  );
}

export default App;