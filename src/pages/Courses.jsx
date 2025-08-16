import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
       const response = await fetch('/api/courses');
        
        if (!response.ok) {
          throw new Error('Error al obtener los cursos');
        }
        
        const data = await response.json();
        setCourses(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4">Cursos Disponibles</h2>
      <Row className="justify-content-center">
        {courses.length > 0 ? (
          courses.map(course => (
            <Col md={4} key={course.id} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>{course.name}</Card.Title>
                  <Card.Text>{course.description}</Card.Text>
                  <Link to={`/courses/${course.id}`}>
                    <Button variant="primary">Ver Detalles</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col className="text-center">
            <Alert variant="info">No hay cursos disponibles.</Alert>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default Courses;
