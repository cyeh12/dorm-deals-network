import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeListings: 0,
    newMessages: 0,
    savedItems: 0,
    totalViews: 0
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if no user data
      window.location.href = '/login';
    }
    
    // TODO: Replace with actual stats from API
    setStats({
      activeListings: 3,
      newMessages: 2,
      savedItems: 5,
      totalViews: 47
    });
  }, []);

  if (!user) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div>Loading...</div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Welcome Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="mb-1">Welcome back, {user.name}! 🎓</h1>
          <p className="text-muted">{user.university}</p>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Button as={Link} to="/post-item" variant="primary" size="lg" className="w-100">
            📝 Post New Item
          </Button>
        </Col>
        <Col md={4} className="mb-3">
          <Button as={Link} to="/browse" variant="outline-primary" size="lg" className="w-100">
            🔍 Browse Items
          </Button>
        </Col>
        <Col md={4} className="mb-3">
          <Button as={Link} to="/messages" variant="outline-secondary" size="lg" className="w-100">
            💬 Messages {stats.newMessages > 0 && <Badge bg="danger">{stats.newMessages}</Badge>}
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-primary">{stats.activeListings}</h3>
              <p className="mb-0">Active Listings</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-success">{stats.totalViews}</h3>
              <p className="mb-0">Total Views</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-warning">{stats.savedItems}</h3>
              <p className="mb-0">Saved Items</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="text-info">{stats.newMessages}</h3>
              <p className="mb-0">New Messages</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row>
        {/* My Listings */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Listings</h5>
              <Button as={Link} to="/my-listings" variant="outline-primary" size="sm">
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {stats.activeListings > 0 ? (
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    📚 Calculus Textbook
                    <Badge bg="success">Active</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    💻 MacBook Pro 2019
                    <Badge bg="success">Active</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    🪑 Desk Chair
                    <Badge bg="warning">Pending</Badge>
                  </ListGroup.Item>
                </ListGroup>
              ) : (
                <p className="text-muted mb-0">No active listings. <Link to="/post-item">Post your first item!</Link></p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent from {user.university}</h5>
              <Button as={Link} to="/browse" variant="outline-primary" size="sm">
                Browse All
              </Button>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  🎮 PlayStation 5
                  <small className="text-muted">2 hours ago</small>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  📖 Chemistry Lab Manual
                  <small className="text-muted">5 hours ago</small>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  🚲 Mountain Bike
                  <small className="text-muted">1 day ago</small>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  🏠 Dorm Mini Fridge
                  <small className="text-muted">2 days ago</small>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Categories */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Popular Categories</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={2} sm={4} xs={6} className="mb-3 text-center">
                  <Button as={Link} to="/browse?category=textbooks" variant="outline-primary" className="w-100">
                    📚<br />Textbooks
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3 text-center">
                  <Button as={Link} to="/browse?category=electronics" variant="outline-primary" className="w-100">
                    💻<br />Electronics
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3 text-center">
                  <Button as={Link} to="/browse?category=furniture" variant="outline-primary" className="w-100">
                    🪑<br />Furniture
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3 text-center">
                  <Button as={Link} to="/browse?category=clothing" variant="outline-primary" className="w-100">
                    👕<br />Clothing
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3 text-center">
                  <Button as={Link} to="/browse?category=sports" variant="outline-primary" className="w-100">
                    ⚽<br />Sports
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3 text-center">
                  <Button as={Link} to="/browse?category=other" variant="outline-primary" className="w-100">
                    📦<br />Other
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
