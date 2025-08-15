import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail'; // Importa un nuevo componente

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/courses" element={<Courses />} />
        {/* Esta es la nueva ruta dinámica */}
        <Route path="/courses/:id" element={<CourseDetail />} /> 
      </Routes>
    </Router>
  );
}

export default App;
