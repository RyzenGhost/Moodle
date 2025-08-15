import React, { useState } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';

function Attendance() {
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          status: 'present',
          checkinAt: new Date(),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar la asistencia');
      }

      const data = await response.json();
      setMessage('Asistencia registrada con éxito!');
      console.log(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4">Registro de Asistencia</h2>
      <Form onSubmit={handleAttendanceSubmit}>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form.Group className="mb-3">
          <Form.Label>ID de Usuario</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ingresa tu ID de usuario"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>ID de Sesión</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ingresa el ID de la sesión"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            required
          />
        </Form.Group>
        
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Marcar Asistencia'}
        </Button>
      </Form>
    </Container>
  );
}

export default Attendance;
