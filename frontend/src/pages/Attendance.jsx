import React from 'react';
import { Container, Row, Col, Button, Table } from 'react-bootstrap';

function Attendance() {
  return (
    <Container>
      <h1 className="my-4 text-center">Gestión de Asistencia</h1>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>Asistencia</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Juan Pérez</td>
            <td>
              <Button variant="success">Presente</Button>
              <Button variant="danger" className="ms-2">Ausente</Button>
            </td>
          </tr>
          {/* Más filas de estudiantes */}
        </tbody>
      </Table>
    </Container>
  );
}

export default Attendance;
