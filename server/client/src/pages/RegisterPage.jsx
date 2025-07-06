import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[DEBUG] Form submitted');
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.edu$/.test(email)) {
      setError('Please use a valid .edu student email address!');
      return;
    }
    setLoading(true);
    try {
      console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
      console.log('[DEBUG] Sending registration data:', { name, email, password: '***' });

      const apiUrl =
        process.env.NODE_ENV === 'production'
          ? 'https://college-student-marketplace-039076a3e43e.herokuapp.com/api/register'
          : 'http://localhost:5000/api/register';

      console.log('[DEBUG] API URL:', apiUrl);

      const res = await axios.post(apiUrl, {
        name,
        email,
        password,
      });

      console.log('[DEBUG] Registration successful:', res.data);
      setSuccess(res.data.message);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('[DEBUG] Registration error:', err);
      console.error('[DEBUG] Error response:', err.response?.data);
      console.error('[DEBUG] Error status:', err.response?.status);
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
      console.log('[DEBUG] Registration attempt completed');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body>
              <h2 className="mb-4 text-center">Create Account</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button variant="success" type="submit" className="w-100" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
