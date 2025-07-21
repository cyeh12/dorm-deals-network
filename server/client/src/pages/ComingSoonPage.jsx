import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ComingSoonPage = ({ feature = 'This feature' }) => {
  return (
    <Container className="py-5 text-center">
      <Alert variant="info">
        <h3>🚧 Coming Soon!</h3>
        <p>{feature} is currently under development.</p>
        <Button as={Link} to="/dashboard" variant="primary">
          Back to Dashboard
        </Button>
      </Alert>
    </Container>
  );
};

export default ComingSoonPage;
