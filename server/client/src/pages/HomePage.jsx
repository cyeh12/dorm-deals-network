import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Carousel } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaLaptop, FaShoppingBag, FaUsers, FaDollarSign, FaShieldAlt, FaSearch, FaPlus, FaUniversity, FaComments, FaHeart, FaUserCheck } from 'react-icons/fa';
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
      icon: <FaSearch className="text-primary" size={48} />,
      title: "Browse Marketplace",
      description: "Explore thousands of items from textbooks to electronics, all organized by category and university."
    },
    {
      icon: <FaHeart className="text-danger" size={48} />,
      title: "Save Favorites",
      description: "Save items you're interested in and get notified when prices drop or similar items are posted."
    },
    {
      icon: <FaUserCheck className="text-success" size={48} />,
      title: "Verified Sellers",
      description: "View detailed seller profiles with ratings, university verification, and transaction history."
    },
    {
      icon: <FaComments className="text-info" size={48} />,
      title: "Direct Messaging",
      description: "Chat directly with buyers and sellers to negotiate prices and arrange safe meetups."
    },
    {
      icon: <FaUsers className="text-warning" size={48} />,
      title: "Study Groups",
      description: "Join or create study groups for your courses and connect with classmates for academic success."
    },
    {
      icon: <FaShieldAlt className="text-secondary" size={48} />,
      title: "Item Details",
      description: "Get comprehensive information about every item including photos, condition, and seller details."
    }
  ];

  const carouselItems = [
    {
      image: "/screenshots/marketplace-browse.png",
      title: "Browse Marketplace",
      description: "Discover items by category, filter by university, and find exactly what you need"
    },
    {
      image: "/screenshots/saved-items-page.png",
      title: "Save Your Favorites",
      description: "Keep track of items you're interested in with our favorites system"
    },
    {
      image: "/screenshots/seller-profile.png",
      title: "Trusted Seller Profiles",
      description: "View seller ratings, university verification, and previous listings"
    },
    {
      image: "/screenshots/messaging_interface.png",
      title: "Direct Communication",
      description: "Chat with buyers and sellers to negotiate and coordinate transactions"
    },
    {
      image: "/screenshots/study-groups-page.png",
      title: "Academic Communities",
      description: "Join study groups and collaborate with classmates in your courses"
    },
    {
      image: "/screenshots/item-detail-page.png",
      title: "Detailed Item Information",
      description: "Get all the details you need including photos, condition, and seller info"
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
                <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Illinois Tech</span> | ITMD 504 - Programming and Application Foundations
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
          <Row className="align-items-center" style={{ minHeight: '400px' }}>
            <Col md={8}>
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
              <h2 className="display-5 fw-bold">Explore Our Platform Features</h2>
              <p className="lead text-muted">See how Dorm Deals Network makes buying and selling simple and safe</p>
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
          
          {/* Screenshots Carousel */}
          <Row className="mt-5">
            <Col>
              <h3 className="text-center mb-4">See It In Action</h3>
              <Carousel className="shadow-lg rounded" indicators={true} controls={true}>
                {carouselItems.map((item, index) => (
                  <Carousel.Item key={index}>
                    <img
                      className="d-block w-100 rounded"
                      src={item.image}
                      alt={item.title}
                      style={{ 
                        height: '500px', 
                        objectFit: 'contain',
                        backgroundColor: '#f8f9fa'
                      }}
                    />
                    <Carousel.Caption className="bg-dark bg-opacity-75 rounded p-3">
                      <h5 className="fw-bold">{item.title}</h5>
                      <p className="mb-0">{item.description}</p>
                    </Carousel.Caption>
                  </Carousel.Item>
                ))}
              </Carousel>
            </Col>
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
