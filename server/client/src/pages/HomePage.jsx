import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaLaptop, FaShoppingBag, FaUsers, FaDollarSign, FaShieldAlt, FaSearch, FaPlus, FaUniversity } from 'react-icons/fa';
import axios from 'axios';

const HomePage = () => {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllUniversities, setShowAllUniversities] = useState(false);
  
  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://dorm-deals-network-1e67636e46cd.herokuapp.com'
    : 'http://localhost:5000';

  // Fetch universities on component mount
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/universities`);
        setUniversities(response.data);
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);
  
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

  return (
    <div>
      {/* Academic Project Banner */}
      <div className="bg-primary text-white py-3">
        <Container>
          <Row className="text-center align-items-center">
            <Col md={8}>
              <strong>
                <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Illinois Tech</span> MS IT | ITMD 504 - Programming and Application Foundations
              </strong>
            </Col>
            <Col md={4}>
              <small>Summative Course Assessment</small>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Hero Section */}
      <div 
        className="text-white py-5 position-relative"
        style={{
          backgroundImage: 'url(/banner.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '500px'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1
          }}
        ></div>
        
        <Container className="position-relative" style={{ zIndex: 2 }}>
          <Row className="align-items-center justify-content-center" style={{ minHeight: '400px' }}>
            <Col md={8} className="text-center">
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
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <div className="py-5">
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

      {/* Supported Universities Section */}
      <div className="bg-light py-5">
        <Container>
          <Row className="text-center mb-4">
            <Col>
              <h2 className="display-5 fw-bold">Supported Universities</h2>
              <p className="lead text-muted">Join students from these amazing institutions</p>
            </Col>
          </Row>
          {loading ? (
            <Row className="text-center">
              <Col>
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading universities...</p>
              </Col>
            </Row>
          ) : (
            <>
              <Row className="justify-content-center">
                {universities.slice(0, showAllUniversities ? universities.length : 4).map((university, index) => (
                  <Col md={3} sm={6} key={index} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="text-center p-3">
                        <FaUniversity className="text-primary mb-2" size={24} />
                        <Card.Title className="h6 mb-1">{university.name}</Card.Title>
                        <Card.Text className="small text-muted">@{university.domain}</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              {universities.length > 4 && (
                <Row className="text-center mt-3">
                  <Col>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => setShowAllUniversities(!showAllUniversities)}
                    >
                      {showAllUniversities ? 'Show Less' : `Show All ${universities.length} Universities`}
                    </Button>
                  </Col>
                </Row>
              )}
            </>
          )}
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
