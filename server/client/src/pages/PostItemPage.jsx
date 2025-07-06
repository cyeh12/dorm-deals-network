import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PostItemPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    condition: '',
    contact_method: 'email',
    contact_info: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is authenticated
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          <h4>Authentication Required</h4>
          <p>You need to be logged in to post an item.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Alert>
      </Container>
    );
  }

  const categories = [
    'Textbooks',
    'Electronics',
    'Furniture',
    'Clothing',
    'Sports & Recreation',
    'Home & Garden',
    'Vehicles',
    'Services',
    'Other'
  ];

  const conditions = [
    'New',
    'Like New',
    'Good',
    'Fair',
    'Poor'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Basic validation
    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      setLoading(false);
      return;
    }
    if (!formData.category) {
      setError('Category is required');
      setLoading(false);
      return;
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      setError('Valid price is required');
      setLoading(false);
      return;
    }
    if (!formData.condition) {
      setError('Condition is required');
      setLoading(false);
      return;
    }

    try {
      console.log('[DEBUG] Posting item:', formData);
      
      const apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://college-student-marketplace-039076a3e43e.herokuapp.com/api/items'
        : 'http://localhost:5000/api/items';

      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        user_id: user.id
      };

      const res = await axios.post(apiUrl, itemData);
      
      console.log('[DEBUG] Item posted successfully:', res.data);
      setSuccess('Item posted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        condition: '',
        contact_method: 'email',
        contact_info: ''
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { successMessage: 'Your item has been posted successfully!' } 
        });
      }, 2000);

    } catch (err) {
      console.error('[DEBUG] Post item error:', err);
      setError(
        err.response?.data?.message || 'Failed to post item. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">📝 Post New Item</h3>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                {/* Title */}
                <Form.Group className="mb-3">
                  <Form.Label>Item Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., MacBook Pro 2019, Calculus Textbook, Desk Chair"
                    required
                  />
                </Form.Group>

                {/* Description */}
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your item in detail. Include any defects, accessories included, etc."
                    required
                  />
                </Form.Group>

                {/* Category and Price Row */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a category...</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price ($) *</Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Condition */}
                <Form.Group className="mb-3">
                  <Form.Label>Condition *</Form.Label>
                  <Form.Select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select condition...</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Contact Information */}
                <Form.Group className="mb-3">
                  <Form.Label>Preferred Contact Method</Form.Label>
                  <Form.Select
                    name="contact_method"
                    value={formData.contact_method}
                    onChange={handleInputChange}
                  >
                    <option value="email">Email (Default: {user.email})</option>
                    <option value="phone">Phone</option>
                    <option value="text">Text Message</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>

                {formData.contact_method !== 'email' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Contact Information</Form.Label>
                    <Form.Control
                      type="text"
                      name="contact_info"
                      value={formData.contact_info}
                      onChange={handleInputChange}
                      placeholder={
                        formData.contact_method === 'phone' ? 'Your phone number' :
                        formData.contact_method === 'text' ? 'Your phone number for texts' :
                        'How buyers should contact you'
                      }
                    />
                  </Form.Group>
                )}

                {/* Submit Button */}
                <div className="d-grid gap-2">
                  <Button 
                    variant="success" 
                    type="submit" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Posting Item...' : 'Post Item'}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>

              <hr className="my-4" />
              <small className="text-muted">
                <strong>Note:</strong> Your item will be visible to other students at {user.university}. 
                Make sure to provide accurate information and respond promptly to interested buyers.
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PostItemPage;
