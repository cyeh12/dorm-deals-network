import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

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
      console.log('[DEBUG] Sending registration data:', { name, email, password: '***' });

      const result = await register(name, email, password);
      
      if (result.success) {
        console.log('[DEBUG] Registration successful:', result.user);
        setSuccess('Registration successful! Please login with your credentials.');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        // Redirect to login page with success message
        setTimeout(() => {
          navigate('/login', { state: { successMessage: 'Registration successful! Please login with your credentials.' } });
        }, 2000); // Show success message for 2 seconds before redirecting
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('[DEBUG] Registration error:', err);
      setError('Registration failed. Please try again.');
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
