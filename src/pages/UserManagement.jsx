import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Table, Alert, Spinner } from 'react-bootstrap';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STUDENT'); // Rol por defecto
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch(`${backendUrl}/users`);
      if (!response.ok) throw new Error('Error al obtener usuarios');
      const data = await response.json();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${backendUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el usuario');
      }

      await fetchUsers(); // Actualiza la lista de usuarios
      setMessage('Usuario creado con éxito!');
      setFullName('');
      setEmail('');
      setRole('STUDENT');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4">Gestión de Usuarios</h2>
      
      <Form onSubmit={handleUserSubmit} className="mb-5">
        <h4>Crear Nuevo Usuario</h4>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form.Group className="mb-3">
          <Form.Label>Nombre Completo</Form.Label>
          <Form.Control type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>
        
        <Form.Group className="mb-3">
          <Form.Label>Rol</Form.Label>
          <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="STUDENT">Estudiante</option>
            <option value="TEACHER">Profesor</option>
          </Form.Select>
        </Form.Group>
        
        <Button variant="success" type="submit" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Crear Usuario'}
        </Button>
      </Form>

      <h4>Usuarios Registrados</h4>
      {loadingUsers ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default UserManagement;