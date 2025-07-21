import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/MyListingsPage.css';

const MyListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      fetchUserListings();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchUserListings = async () => {
    try {
      console.log('[DEBUG] Fetching listings for authenticated user');
      const response = await axios.get('/api/my-items');
      console.log('[DEBUG] Fetched listings:', response.data);
      setListings(response.data);
    } catch (err) {
      console.error('[DEBUG] Error fetching listings:', err);
      setError('Failed to load your listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      console.log('[DEBUG] Deleting item:', itemId);
      await axios.delete(`/api/items/${itemId}`);
      console.log('[DEBUG] Item deleted successfully');
      
      // Remove item from local state
      setListings(listings.filter(item => item.id !== itemId));
      
      // Show success message
      alert('Listing deleted successfully!');
    } catch (err) {
      console.error('[DEBUG] Error deleting item:', err);
      alert('Failed to delete listing. Please try again.');
    }
  };

  const handleEditItem = (itemId) => {
    navigate(`/edit-item/${itemId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'sold':
        return 'status-sold';
      case 'inactive':
        return 'status-inactive';
      default:
        return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="my-listings-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-listings-page">
      <div className="container">
        <div className="page-header">
          <h1>My Listings</h1>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/post-item')}
          >
            Post New Item
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {listings.length === 0 ? (
          <div className="no-listings">
            <div className="no-listings-content">
              <h2>No listings yet</h2>
              <p>You haven't posted any items for sale yet.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/post-item')}
              >
                Post Your First Item
              </button>
            </div>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map(item => (
              <div key={item.id} className="listing-card">
                <div className="listing-header">
                  <h3 className="listing-title">{item.title}</h3>
                  <span className={`status-badge ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                
                <div className="listing-details">
                  <p className="listing-price">{formatPrice(item.price)}</p>
                  <p className="listing-category">{item.category}</p>
                  <p className="listing-condition">Condition: {item.condition}</p>
                  <p className="listing-description">{item.description}</p>
                </div>

                <div className="listing-meta">
                  <p className="listing-date">Posted: {formatDate(item.created_at)}</p>
                  <p className="listing-contact">
                    Contact: {item.contact_method === 'email' ? item.contact_info : `${item.contact_method}: ${item.contact_info}`}
                  </p>
                </div>

                <div className="listing-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleEditItem(item.id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="listings-summary">
          <p>
            Showing {listings.length} listing{listings.length !== 1 ? 's' : ''} • 
            Active: {listings.filter(item => item.status === 'active').length} • 
            Sold: {listings.filter(item => item.status === 'sold').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyListingsPage;
