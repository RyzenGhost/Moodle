import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

function Home() {
  return (
    <Container>
      <Row className="my-5 text-center">
        <Col>
          <h1>Bienvenido a la Plataforma Moodle</h1>
          <p>Tu herramienta para gestionar cursos y asistencia de forma eficiente.</p>
        </Col>
      </Row>
      <Row className="text-center">
        <Col md={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Cursos</Card.Title>
              <Card.Text>Consulta y gestiona los cursos disponibles.</Card.Text>
              <Button variant="primary" href="/courses">Ver Cursos</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Asistencia</Card.Title>
              <Card.Text>Marca y verifica la asistencia de los estudiantes.</Card.Text>
              <Button variant="primary" href="/attendance">Ver Asistencia</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Contactar</Card.Title>
              <Card.Text>Si tienes alguna pregunta, ¡contáctanos!</Card.Text>
              <Button variant="primary" href="/contact">Contactar</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
