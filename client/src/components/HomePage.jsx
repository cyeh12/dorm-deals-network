import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

const HomePage = () => (
  <Container className="text-center py-5">
    <Row className="justify-content-center">
      <Col md={8}>
        <h1>Welcome to the College Student Marketplace!</h1>
        <p className="lead mt-4">
          Buy, sell, and trade items with fellow students. Find textbooks, electronics, dorm essentials, and more—all in one place.
        </p>
        <Button variant="primary" href="/marketplace" className="mt-3">
          Browse Marketplace
        </Button>
      </Col>
    </Row>
  </Container>
);

export default HomePage;
