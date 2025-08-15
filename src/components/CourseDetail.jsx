import React from 'react';
import { useParams } from 'react-router-dom';

function CourseDetail() {
  const { id } = useParams(); // Obtiene el ID de la URL

  // Aquí puedes usar el 'id' para hacer una petición a tu backend
  // y obtener los datos del curso específico.

  return (
    <div>
      <h2>Detalles del Curso</h2>
      <p>ID del Curso: {id}</p>
    </div>
  );
}

export default CourseDetail;