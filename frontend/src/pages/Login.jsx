import React, { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes manejar la autenticación con el backend
  };

  return (
    <Container>
      <h1 className="my-4 text-center">Iniciar Sesión</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control 
            type="email" 
            placeholder="Ingrese su email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control 
            type="password" 
            placeholder="Ingrese su contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Iniciar Sesión
        </Button>
      </Form>
    </Container>
  );
}

export default Login;
