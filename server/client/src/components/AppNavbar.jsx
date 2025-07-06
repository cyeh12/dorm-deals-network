import React from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUniversity, FaUser } from 'react-icons/fa';

const AppNavbar = () => {
  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <FaUniversity className="me-2" />
          Campus Marketplace
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/marketplace">Marketplace</Nav.Link>
            <Nav.Link as={Link} to="/study-groups">Study Groups</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/dashboard">
              <FaUser className="me-1" />
              My Account
            </Nav.Link>
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;