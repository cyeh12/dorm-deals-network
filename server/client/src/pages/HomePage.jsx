import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaLaptop, FaShoppingBag, FaUsers, FaDollarSign, FaShieldAlt, FaSearch, FaPlus } from 'react-icons/fa';

const HomePage = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: <FaBook className="text-primary" size={48} />,
      title: "Textbooks & Study Materials",
      description: "Find affordable textbooks, study guides, and course materials from fellow students."
    },
    {
      icon: <FaLaptop className="text-success" size={48} />,
      title: "Electronics & Tech",
      description: "Discover laptops, tablets, headphones, and other tech essentials at student prices."
    },
    {
      icon: <FaShoppingBag className="text-warning" size={48} />,
      title: "Dorm Essentials",
      description: "Get furniture, appliances, and dorm decor to make your space feel like home."
    },
    {
      icon: <FaUsers className="text-info" size={48} />,
      title: "Student Community",
      description: "Connect with students from your university and build lasting relationships."
    },
    {
      icon: <FaDollarSign className="text-success" size={48} />,
      title: "Budget-Friendly",
      description: "Save money and earn cash by buying and selling within your student community."
    },
    {
      icon: <FaShieldAlt className="text-danger" size={48} />,
      title: "Safe & Secure",
      description: "Trade safely with verified university students in your local area."
    }
  ];

  const stats = [
    { number: "1000+", label: "Items Listed" },
    { number: "500+", label: "Active Students" },
    { number: "50+", label: "Universities" },
    { number: "$10k+", label: "Money Saved" }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4 fw-bold">Welcome to Dorm Deals Network!</h1>
              <p className="lead mt-3">
                The premier marketplace for college students to buy, sell, and trade items safely within their university community.
              </p>
              <div className="mt-4">
                <Button 
                  variant="light" 
                  size="lg" 
                  className="me-3"
                  onClick={() => navigate('/marketplace')}
                >
                  <FaSearch className="me-2" />
                  Browse Marketplace
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg"
                  onClick={() => navigate('/post-item')}
                >
                  <FaPlus className="me-2" />
                  Sell Your Items
                </Button>
              </div>
            </Col>
            <Col md={6} className="text-center">
              <div className="bg-light text-dark rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '200px', height: '200px' }}>
                <FaUsers size={80} className="text-primary" />
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Stats Section */}
      <Container className="py-5">
        <Row className="text-center">
          {stats.map((stat, index) => (
            <Col md={3} key={index} className="mb-4">
              <h2 className="display-4 fw-bold text-primary">{stat.number}</h2>
              <p className="text-muted">{stat.label}</p>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Features Section */}
      <div className="bg-light py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold">Why Choose Dorm Deals Network?</h2>
              <p className="lead text-muted">Everything you need for college life, right at your fingertips</p>
            </Col>
          </Row>
          <Row>
            {features.map((feature, index) => (
              <Col md={4} key={index} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="text-center p-4">
                    <div className="mb-3">{feature.icon}</div>
                    <Card.Title className="h5">{feature.title}</Card.Title>
                    <Card.Text className="text-muted">{feature.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* Call to Action Section */}
      <Container className="py-5">
        <Row className="text-center">
          <Col md={8} className="mx-auto">
            <h2 className="display-5 fw-bold">Ready to Start Saving?</h2>
            <p className="lead text-muted mt-3">
              Join thousands of students who are already buying and selling on Dorm Deals Network. 
              It's free to join and easy to get started!
            </p>
            <div className="mt-4">
              <Button 
                variant="primary" 
                size="lg" 
                className="me-3"
                onClick={() => navigate('/register')}
              >
                Get Started Now
              </Button>
              <Button 
                variant="outline-primary" 
                size="lg"
                onClick={() => navigate('/marketplace')}
              >
                Explore Marketplace
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;
