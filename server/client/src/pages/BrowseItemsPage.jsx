import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, InputGroup } from 'react-bootstrap';
import { FaSearch, FaFilter, FaMapMarkerAlt, FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/BrowseItemsPage.css';

const BrowseItemsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [universities, setUniversities] = useState([]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'textbooks', label: 'Textbooks' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'sports', label: 'Sports & Recreation' },
    { value: 'other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'title', label: 'Title A-Z' }
  ];

  useEffect(() => {
    fetchItems();
    fetchUniversities();
  }, []);

  // Handle URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, selectedCategory]);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchTerm, selectedCategory, selectedUniversity, priceRange, sortBy]);

  const fetchItems = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://college-student-marketplace-039076a3e43e.herokuapp.com'
        : 'http://localhost:5000';

      const response = await axios.get(`${apiUrl}/api/items`);
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://college-student-marketplace-039076a3e43e.herokuapp.com'
        : 'http://localhost:5000';

      const response = await axios.get(`${apiUrl}/api/universities`);
      setUniversities(response.data);
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  };

  const filterAndSortItems = () => {
    let filtered = [...items];
    
    console.log('[DEBUG] Starting filter with:', {
      totalItems: items.length,
      selectedCategory,
      searchTerm,
      selectedUniversity
    });

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('[DEBUG] After search filter:', filtered.length);
    }

    // Filter by category (case-insensitive)
    if (selectedCategory !== 'all') {
      console.log('[DEBUG] Filtering by category:', selectedCategory);
      console.log('[DEBUG] Available categories in items:', [...new Set(items.map(item => item.category))]);
      
      filtered = filtered.filter(item => 
        item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      console.log('[DEBUG] After category filter:', filtered.length);
    }

    // Filter by university
    if (selectedUniversity !== 'all') {
      filtered = filtered.filter(item => item.university_name === selectedUniversity);
      console.log('[DEBUG] After university filter:', filtered.length);
    }

    // Filter by price range
    if (priceRange.min !== '') {
      filtered = filtered.filter(item => parseFloat(item.price) >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(item => parseFloat(item.price) <= parseFloat(priceRange.max));
    }

    // Sort items
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'price_low':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_high':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredItems(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    
    // Update URL parameters
    if (newCategory === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', newCategory);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedUniversity('all');
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
    
    // Clear URL parameters
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getConditionColor = (condition) => {
    switch (condition.toLowerCase()) {
      case 'new': return 'success';
      case 'like new': return 'info';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'danger';
      default: return 'secondary';
    }
  };

  const getContactIcon = (method) => {
    switch (method) {
      case 'email': return <FaEnvelope />;
      case 'phone': return <FaPhone />;
      default: return <FaEnvelope />;
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-3">Browse Items</h1>
          <p className="text-muted">Discover items from students across universities</p>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Row className="g-3">
                {/* Search Bar */}
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search items, sellers..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </InputGroup>
                </Col>

                {/* Category Filter */}
                <Col md={2}>
                  <Form.Select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Form.Select>
                </Col>

                {/* University Filter */}
                <Col md={2}>
                  <Form.Select
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                  >
                    <option value="all">All Universities</option>
                    {universities.map(uni => (
                      <option key={uni.id} value={uni.name}>{uni.name}</option>
                    ))}
                  </Form.Select>
                </Col>

                {/* Price Range */}
                <Col md={2}>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      placeholder="Min $"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    />
                    <Form.Control
                      type="number"
                      placeholder="Max $"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    />
                  </InputGroup>
                </Col>

                {/* Sort */}
                <Col md={2}>
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <FaFilter className="me-1" />
                    Clear Filters
                  </Button>
                  <span className="ms-3 text-muted">
                    {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
                  </span>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Items Grid */}
      <Row>
        {filteredItems.length === 0 ? (
          <Col>
            <div className="text-center py-5">
              <h4 className="text-muted">No items found</h4>
              <p className="text-muted">Try adjusting your search or filters</p>
              <Button variant="primary" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </Col>
        ) : (
          filteredItems.map(item => (
            <Col key={item.id} md={6} lg={4} className="mb-4">
              <Card className="h-100 item-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{item.title}</h5>
                    <Badge bg={getConditionColor(item.condition)}>
                      {item.condition}
                    </Badge>
                  </div>
                  
                  <div className="price-section mb-2">
                    <h4 className="text-success mb-0">${formatPrice(item.price)}</h4>
                  </div>

                  <p className="card-text text-muted small mb-2">
                    {item.description.length > 100 
                      ? `${item.description.substring(0, 100)}...` 
                      : item.description
                    }
                  </p>

                  <div className="seller-info mb-2">
                    <small className="text-muted">
                      <FaUser className="me-1" />
                      {item.seller_name}
                    </small>
                    <br />
                    <small className="text-muted">
                      <FaMapMarkerAlt className="me-1" />
                      {item.university_name || 'Unknown University'}
                    </small>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Posted {formatDate(item.created_at)}
                    </small>
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          if (item.contact_method === 'email') {
                            window.location.href = `mailto:${item.contact_info}?subject=Interest in ${item.title}`;
                          } else {
                            alert(`Contact: ${item.contact_info}`);
                          }
                        }}
                      >
                        {getContactIcon(item.contact_method)}
                        <span className="ms-1">Contact</span>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default BrowseItemsPage;
