import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaTag, FaArrowLeft, FaEdit } from 'react-icons/fa';
import axios from 'axios';
import '../styles/ItemDetailPage.css';

const ItemDetailPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);

  useEffect(() => {
    // Get current user
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    fetchItemDetails();
  }, [itemId]);

  useEffect(() => {
    if (item) {
      fetchRelatedItems();
    }
  }, [item]);

  const fetchItemDetails = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://college-student-marketplace-039076a3e43e.herokuapp.com'
        : 'http://localhost:5000';

      const response = await axios.get(`${apiUrl}/api/items/${itemId}`);
      
      // Get seller info and university info
      const itemWithDetails = await enrichItemWithDetails(response.data);
      setItem(itemWithDetails);
    } catch (err) {
      console.error('Error fetching item details:', err);
      if (err.response?.status === 404) {
        setError('Item not found');
      } else {
        setError('Failed to load item details');
      }
    } finally {
      setLoading(false);
    }
  };

  const enrichItemWithDetails = async (itemData) => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://college-student-marketplace-039076a3e43e.herokuapp.com'
        : 'http://localhost:5000';

      // Get all items to find this one with seller details
      const allItemsResponse = await axios.get(`${apiUrl}/api/items`);
      const itemWithDetails = allItemsResponse.data.find(i => i.id == itemId);
      
      return itemWithDetails || itemData;
    } catch (err) {
      console.error('Error enriching item details:', err);
      return itemData;
    }
  };

  const fetchRelatedItems = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://college-student-marketplace-039076a3e43e.herokuapp.com'
        : 'http://localhost:5000';

      const response = await axios.get(`${apiUrl}/api/items`);
      
      // Filter related items (same category, different item, limit to 3)
      const related = response.data
        .filter(i => 
          i.id != itemId && 
          i.category === item.category &&
          i.status === 'active'
        )
        .slice(0, 3);
      
      setRelatedItems(related);
    } catch (err) {
      console.error('Error fetching related items:', err);
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'new': return 'success';
      case 'like new': return 'info';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'danger';
      default: return 'secondary';
    }
  };

  const getConditionDescription = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'new': return 'Brand new, never used';
      case 'like new': return 'Barely used, excellent condition';
      case 'good': return 'Used but in good working condition';
      case 'fair': return 'Shows signs of wear but functional';
      case 'poor': return 'Heavy wear, may need repair';
      default: return 'Condition not specified';
    }
  };

  const handleContact = () => {
    if (item.contact_method === 'email') {
      const subject = `Interest in ${item.title}`;
      const body = `Hi ${item.seller_name},\n\nI'm interested in your listing for "${item.title}" posted on Campus Marketplace.\n\nCould you please provide more details?\n\nThanks!`;
      window.location.href = `mailto:${item.contact_info}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      alert(`Contact ${item.seller_name} at: ${item.contact_info}`);
    }
  };

  const isOwner = user && item && user.id === item.user_id;

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <h4>Error</h4>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/browse')}>
            Back to Browse
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          <h4>Item Not Found</h4>
          <p>The item you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline-warning" onClick={() => navigate('/browse')}>
            Back to Browse
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Back Button */}
      <Row className="mb-3">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" />
            Back
          </Button>
        </Col>
      </Row>

      <Row>
        {/* Main Item Details */}
        <Col lg={8} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              {/* Item Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="flex-grow-1">
                  <h1 className="h2 mb-2">{item.title}</h1>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Badge bg={getConditionColor(item.condition)} className="fs-6">
                      {item.condition}
                    </Badge>
                    <Badge bg="secondary" className="fs-6">
                      <FaTag className="me-1" />
                      {item.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-end">
                  <h2 className="text-success mb-0">${formatPrice(item.price)}</h2>
                  {isOwner && (
                    <Button 
                      as={Link} 
                      to={`/edit-item/${item.id}`}
                      variant="outline-primary" 
                      size="sm" 
                      className="mt-2"
                    >
                      <FaEdit className="me-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Item Image */}
              {item.image_url && (
                <div className="item-image mb-4 text-center">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="img-fluid rounded shadow-sm"
                    style={{
                      maxHeight: '400px',
                      maxWidth: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Condition Details */}
              <div className="condition-section mb-4 p-3 bg-light rounded">
                <h6 className="mb-2">Condition Details</h6>
                <p className="mb-0 text-muted">{getConditionDescription(item.condition)}</p>
              </div>

              {/* Description */}
              <div className="description-section mb-4">
                <h5 className="mb-3">Description</h5>
                <p className="lead" style={{ whiteSpace: 'pre-wrap' }}>
                  {item.description}
                </p>
              </div>

              {/* Item Details */}
              <div className="item-details mb-4">
                <h5 className="mb-3">Details</h5>
                <Row>
                  <Col md={6}>
                    <div className="detail-item mb-2">
                      <strong>Category:</strong> {item.category}
                    </div>
                    <div className="detail-item mb-2">
                      <strong>Condition:</strong> {item.condition}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="detail-item mb-2">
                      <strong>Posted:</strong> {formatDate(item.created_at)}
                    </div>
                    {item.updated_at && item.updated_at !== item.created_at && (
                      <div className="detail-item mb-2">
                        <strong>Updated:</strong> {formatDate(item.updated_at)}
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Seller Info */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaUser className="me-2" />
                Seller Information
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="seller-info">
                <h6 className="mb-2">{item.seller_name}</h6>
                <p className="text-muted mb-2">
                  <FaMapMarkerAlt className="me-2" />
                  {item.university_name || 'Unknown University'}
                </p>
                <p className="text-muted mb-3">
                  <FaClock className="me-2" />
                  Member since {new Date(item.created_at).getFullYear()}
                </p>
                
                {!isOwner && (
                  <Button 
                    variant="primary" 
                    className="w-100 mb-2"
                    onClick={handleContact}
                  >
                    {item.contact_method === 'email' ? (
                      <>
                        <FaEnvelope className="me-2" />
                        Contact Seller
                      </>
                    ) : (
                      <>
                        <FaPhone className="me-2" />
                        Contact Seller
                      </>
                    )}
                  </Button>
                )}
                
                {isOwner && (
                  <Alert variant="info" className="mb-0">
                    <small>This is your listing</small>
                  </Alert>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Safety Tips */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Safety Tips</h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-0 small">
                <li className="mb-2">✅ Meet in public places</li>
                <li className="mb-2">✅ Inspect items before purchase</li>
                <li className="mb-2">✅ Use secure payment methods</li>
                <li className="mb-0">❌ Never share personal info unnecessarily</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <Row className="mt-4">
          <Col>
            <h4 className="mb-3">Related Items</h4>
            <Row>
              {relatedItems.map(relatedItem => (
                <Col key={relatedItem.id} md={4} className="mb-3">
                  <Card className="h-100 related-item-card">
                    <Card.Body>
                      <h6 className="card-title">
                        <Link 
                          to={`/items/${relatedItem.id}`}
                          className="text-decoration-none"
                        >
                          {relatedItem.title}
                        </Link>
                      </h6>
                      <p className="text-success mb-2">${formatPrice(relatedItem.price)}</p>
                      <p className="text-muted small mb-2">
                        by {relatedItem.seller_name}
                      </p>
                      <Badge bg={getConditionColor(relatedItem.condition)}>
                        {relatedItem.condition}
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default ItemDetailPage;
