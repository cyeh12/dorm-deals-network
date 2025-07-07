import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaHeart } from 'react-icons/fa';

const SavedItemsPage = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://college-student-marketplace-039076a3e43e.herokuapp.com'
    : 'http://localhost:5000';

  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    fetchSavedItems();
    // eslint-disable-next-line
  }, []);

  const fetchSavedItems = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/users/${user.id}/saved-items`);
      setSavedItems(res.data);
    } catch (err) {
      setError('Failed to load saved items.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col>
          <Button as={Link} to="/dashboard" variant="outline-secondary">
            <FaArrowLeft className="me-2" />Back to Dashboard
          </Button>
        </Col>
      </Row>
      <h2 className="mb-4">My Saved Items <FaHeart color="#e63946" /></h2>
      {savedItems.length === 0 ? (
        <Alert variant="info">You have no saved items yet.</Alert>
      ) : (
        <Row>
          {savedItems.map(item => (
            <Col md={4} key={item.id} className="mb-4">
              <Card className="h-100">
                {item.image_url && (
                  <Card.Img variant="top" src={item.image_url} style={{ height: 200, objectFit: 'cover' }} />
                )}
                <Card.Body>
                  <Card.Title>
                    <Link to={`/items/${item.id}`}>{item.title}</Link>
                  </Card.Title>
                  <Card.Text>${parseFloat(item.price).toFixed(2)}</Card.Text>
                  <Card.Text className="text-muted small">{item.category}</Card.Text>
                  {item.item_status && (
                    <Card.Text className={`fw-bold mb-0 status-label status-${item.item_status}`}>
                      Status: {item.item_status.charAt(0).toUpperCase() + item.item_status.slice(1)}
                    </Card.Text>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default SavedItemsPage;
