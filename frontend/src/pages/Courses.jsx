import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

function Courses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Aquí, puedes hacer una llamada a la API para obtener los cursos
    // Por ahora, usamos datos de ejemplo
    const fetchCourses = async () => {
      const data = [
        { id: 1, name: 'Introducción a la Programación', description: 'Curso para principiantes en lenguajes como Python y JavaScript.' },
        { id: 2, name: 'Bases de Datos', description: 'Aprende a diseñar y gestionar bases de datos relacionales y no relacionales.' },
        { id: 3, name: 'Desarrollo Web Avanzado', description: 'Profundiza en frameworks como React y Vue.js.' },
      ];
      setCourses(data);
    };

    fetchCourses();
  }, []);

  return (
    <Container>
      <h1 className="my-4 text-center">Cursos Disponibles</h1>
      <Row>
        {courses.map(course => (
          <Col md={4} key={course.id} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>{course.name}</Card.Title>
                <Card.Text>{course.description}</Card.Text>
                <Button variant="primary" href={`/courses/${course.id}`}>Ver Detalles</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Courses;
