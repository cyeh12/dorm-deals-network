import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchUserData(parsedUser.id);
    } else {
      // Redirect to login if no user data
      window.location.href = '/login';
    }
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://college-student-marketplace-039076a3e43e.herokuapp.com'
        : 'http://localhost:5000';

      // Fetch user's items
      const userItemsRes = await axios.get(`${apiUrl}/api/users/${userId}/items`);
      setUserItems(userItemsRes.data);

      // Fetch recent items from the marketplace
      const allItemsRes = await axios.get(`${apiUrl}/api/items`);
      setRecentItems(allItemsRes.data.slice(0, 4)); // Get first 4 items

      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        activeListings: userItemsRes.data.filter(item => item.status === 'active').length
      }));

    } catch (err) {
      console.error('Error fetching user data:', err);
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
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Loading...</span>
                </div>
              ) : userItems.length > 0 ? (
                <ListGroup variant="flush">
                  {userItems.slice(0, 3).map((item, index) => (
                    <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{item.title}</strong>
                        <br />
                        <small className="text-muted">${item.price}</small>
                      </div>
                      <Badge bg={item.status === 'active' ? 'success' : 'warning'}>
                        {item.status === 'active' ? 'Active' : 'Pending'}
                      </Badge>
                    </ListGroup.Item>
                  ))}
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
              <h5 className="mb-0">Recent Marketplace Activity</h5>
              <Button as={Link} to="/browse" variant="outline-primary" size="sm">
                Browse All
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Loading...</span>
                </div>
              ) : recentItems.length > 0 ? (
                <ListGroup variant="flush">
                  {recentItems.map((item, index) => (
                    <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <Link to={`/items/${item.id}`} className="text-decoration-none">
                          <strong>{item.title}</strong>
                        </Link>
                        <br />
                        <small className="text-muted">by {item.seller_name} • ${item.price}</small>
                        <br />
                        <small className="text-muted">📍 {item.university_name || 'Unknown University'}</small>
                      </div>
                      <small className="text-muted">
                        {new Date(item.created_at).toLocaleDateString()}
                      </small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted mb-0">No recent items from your university.</p>
              )}
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
