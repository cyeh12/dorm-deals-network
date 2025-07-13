import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUniversity, FaUser, FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AppNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    if (!user || !isAuthenticated) return;
    try {
      const res = await axios.get('/api/my-unread-messages-count');
      setUnreadCount(res.data.count);
    } catch (err) {
      console.log('Error fetching unread count:', err);
      setUnreadCount(0);
    }
  };

  // Fetch unread count on mount and when location changes
  useEffect(() => {
    if (!loading) {
      fetchUnreadCount();
    }
  }, [user, isAuthenticated, location.pathname, loading]);

  // Refresh unread count when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <span className="bg-white px-2 py-1 rounded d-inline-flex align-items-center">
            <img
              src="/logo.ico"
              alt="Dorm Deals Network Logo"
              width="30"
              height="30"
              className="d-inline-block align-top me-2"
            />
            <span className="fw-bold text-black">Dorm Deals Network</span>
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/marketplace">Marketplace</Nav.Link>
            <Nav.Link as={Link} to="/study-groups">Study Groups</Nav.Link>
          </Nav>
          <Nav>
            {isAuthenticated && user ? (
              <>
                <Nav.Link as={Link} to="/dashboard">
                  {user.name}'s Dashboard
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
              !loading && <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;