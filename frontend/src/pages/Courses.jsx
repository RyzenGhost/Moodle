import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

function Courses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Aquí, puedes hacer una llamada a la API para obtener los cursos
    fetch('/api/courses')
      .then(response => response.json())
      .then(data => setCourses(data));
  }, []);

  return (
    <Container>
      <h1 className="my-4 text-center">Cursos Disponibles</h1>
      <Row>
        {courses.map(course => (
          <Col md={4} key={course.id}>
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
