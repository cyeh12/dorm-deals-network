import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/EditItemPage.css';

const EditItemPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    condition: '',
    contact_method: 'email',
    contact_info: '',
    status: 'active'
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const validCategories = [
    'textbooks', 'electronics', 'furniture', 'clothing', 'transportation', 'other'
  ];
  const validConditions = [
    'new', 'like-new', 'good', 'fair', 'poor'
  ];

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchItemData(itemId);
  }, [navigate, itemId]);

  const fetchItemData = async (id) => {
    try {
      console.log('[DEBUG] Fetching item data for editing:', id);
      const response = await axios.get(`/api/items/${id}`);
      const item = response.data;
      
      // Check if current user owns this item
      const userData = JSON.parse(localStorage.getItem('user'));
      if (item.user_id !== userData.id) {
        setError('You can only edit your own items.');
        return;
      }
      
      let category = item.category || '';
      let condition = item.condition || '';
      if (!validCategories.includes(category)) category = '';
      if (!validConditions.includes(condition)) condition = '';
      setFormData({
        title: item.title || '',
        description: item.description || '',
        category,
        price: item.price || '',
        condition,
        contact_method: item.contact_method || 'email',
        contact_info: item.contact_info || '',
        status: item.status || 'active'
      });
      setExistingImageUrl(item.image_url || '');
      setImagePreview(item.image_url || '');
    } catch (err) {
      console.error('[DEBUG] Error fetching item data:', err);
      setError('Failed to load item data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setExistingImageUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.price || !formData.condition) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      if (selectedImage) {
        data.append('image', selectedImage);
      } else if (!imagePreview && !existingImageUrl) {
        data.append('image', ''); // Remove image if none selected and none existing
      }
      console.log('[DEBUG] Updating item:', itemId);
      await axios.put(`/api/items/${itemId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[DEBUG] Item updated successfully');
      
      alert('Item updated successfully!');
      navigate('/my-listings');
    } catch (err) {
      console.error('[DEBUG] Error updating item:', err);
      setError('Failed to update item. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="edit-item-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading item data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-item-page">
      <div className="container">
        <div className="page-header">
          <h1>Edit Item</h1>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/my-listings')}
          >
            Back to My Listings
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="form-container">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength="255"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                maxLength="1000"
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="textbooks">Textbooks</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                  <option value="clothing">Clothing</option>
                  <option value="transportation">Transportation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Price ($) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="condition">Condition *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Condition</option>
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact_method">Contact Method</label>
              <select
                id="contact_method"
                name="contact_method"
                value={formData.contact_method}
                onChange={handleInputChange}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text</option>
                <option value="other">Other</option>
              </select>
            </div>

            {formData.contact_method !== 'email' && (
              <div className="form-group">
                <label htmlFor="contact_info">Contact Information</label>
                <input
                  type="text"
                  id="contact_info"
                  name="contact_info"
                  value={formData.contact_info}
                  onChange={handleInputChange}
                  placeholder="Enter your contact information"
                  maxLength="255"
                />
              </div>
            )}

            <div className="form-group">
              <label>Item Image</label>
              {imagePreview ? (
                <div style={{ marginBottom: 8 }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8 }} />
                  <button type="button" className="btn btn-danger btn-sm ms-2" onClick={removeImage}>Remove Image</button>
                </div>
              ) : existingImageUrl ? (
                <div style={{ marginBottom: 8 }}>
                  <img src={existingImageUrl} alt="Current" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8 }} />
                  <button type="button" className="btn btn-danger btn-sm ms-2" onClick={removeImage}>Remove Image</button>
                </div>
              ) : null}
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Update Item
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate('/my-listings')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditItemPage;
