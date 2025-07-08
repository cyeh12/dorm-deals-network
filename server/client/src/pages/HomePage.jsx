import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <Container className="text-center py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <h1>Welcome to Dorm Deals Network!</h1>
          <p className="lead mt-4">
            Buy, sell, and trade items with fellow students. Find textbooks, electronics, dorm essentials, and more—all in one place.
          </p>
          <Button variant="primary" className="mt-3" onClick={() => navigate('/marketplace')}>
            Browse Marketplace
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
