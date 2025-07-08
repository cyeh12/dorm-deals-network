import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUniversity, FaUser, FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';

const AppNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [unreadCount, setUnreadCount] = useState(0);
  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://dorm-deals-network-1e67636e46cd.herokuapp.com'
    : 'http://localhost:5000';

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${apiUrl}/api/users/${user.id}/unread-messages-count`);
      setUnreadCount(res.data.count);
    } catch (err) {
      console.log('Error fetching unread count:', err);
    }
  };

  // Fetch unread count on mount and when location changes
  useEffect(() => {
    fetchUnreadCount();
  }, [user, location.pathname]);

  // Refresh unread count when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <FaUniversity className="me-2" />
          Dorm Deals Network
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/marketplace">Marketplace</Nav.Link>
            <Nav.Link as={Link} to="/study-groups">Study Groups</Nav.Link>
          </Nav>
          <Nav>
            {user ? (
              <>
                <Nav.Link as={Link} to="/dashboard">
                  <FaUser className="me-1" />
                  Welcome, {user.name}
                </Nav.Link>
                <Nav.Link as={Link} to="/my-listings">My Listings</Nav.Link>
                <Nav.Link as={Link} to="/post-item">Post Item</Nav.Link>
                <Nav.Link as={Link} to="/saved-items">Saved Items</Nav.Link>
                <Nav.Link as={Link} to="/messages">
                  Messages {unreadCount > 0 && <Badge bg="danger" pill>{unreadCount}</Badge>}
                </Nav.Link>
                <Button variant="outline-light" size="sm" onClick={handleLogout} className="ms-2">
                  <FaSignOutAlt className="me-1" />
                  Logout
                </Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;