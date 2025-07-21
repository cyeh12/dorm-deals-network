import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => (
  <footer className="bg-dark text-white py-3 mt-auto">
    <Container className="text-center">
      <small>&copy; {new Date().getFullYear()} Dorm Deals Network. All rights reserved.</small>
    </Container>
  </footer>
);

export default Footer;
