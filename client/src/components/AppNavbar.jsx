import React from 'react';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { FaUniversity, FaShoppingCart, FaUser } from 'react-icons/fa';

const AppNavbar = () => {
  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>
            <FaUniversity className="me-2" />
            Campus Marketplace
          </Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/marketplace">
              <Nav.Link>Marketplace</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/study-groups">
              <Nav.Link>Study Groups</Nav.Link>
            </LinkContainer>
          </Nav>
          <Nav>
            <LinkContainer to="/dashboard">
              <Nav.Link>
                <FaUser className="me-1" />
                My Account
              </Nav.Link>
            </LinkContainer>
            <LinkContainer to="/login">
              <Nav.Link>Login</Nav.Link>
            </LinkContainer>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;