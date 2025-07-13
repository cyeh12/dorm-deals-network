# JWT Authentication Implementation

This document explains how JWT (JSON Web Token) authentication has been implemented in the college marketplace application.

## Overview

JWT authentication provides secure, stateless authentication with the following features:
- **Access Tokens**: Short-lived tokens (24 hours) for API access
- **Refresh Tokens**: Long-lived tokens (7 days) for obtaining new access tokens
- **Automatic Token Refresh**: Seamless token renewal before expiration
- **Protected Routes**: Secure API endpoints that require authentication

## How It Works

### 1. Login Process
```javascript
// User logs in with email and password
POST /api/login
{
  "email": "user@university.edu",
  "password": "password123"
}

// Server responds with tokens and user data
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@university.edu",
    "university": "Sample University"
  }
}
```

### 2. Making Authenticated Requests
```javascript
// Include access token in Authorization header
headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
```

### 3. Token Refresh
```javascript
// When access token expires, use refresh token
POST /api/refresh-token
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Server responds with new tokens
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## API Endpoints

### Authentication Endpoints
- `POST /api/login` - User login (returns tokens)
- `POST /api/refresh-token` - Refresh access token
- `POST /api/logout` - Logout (clears refresh token)
- `GET /api/verify-token` - Verify token validity

### Protected Endpoints
- `POST /api/items` - Create new item (requires auth)
- `GET /api/my-items` - Get current user's items
- `DELETE /api/items/:itemId` - Delete item (owner only)
- `POST /api/messages` - Send message
- `GET /api/my-conversations` - Get user's conversations
- `GET /api/my-unread-messages-count` - Get unread count
- `POST /api/users/:userId/profile-image` - Upload profile image (owner only)
- `DELETE /api/users/:userId/profile-image` - Remove profile image (owner only)

### Public Endpoints (No Auth Required)
- `POST /api/register` - User registration
- `GET /api/items` - Browse all items
- `GET /api/items/:itemId` - View single item
- `GET /api/universities` - Get universities list
- `GET /api/users/:userId` - Get user profile (public info)

## Client-Side Usage

### 1. Setup Authentication Utilities
```javascript
import { authUtils, setupAxiosInterceptors } from './utils/auth';
import axios from 'axios';

// Setup automatic token handling
setupAxiosInterceptors(axios);
```

### 2. Login
```javascript
const login = async (email, password) => {
  try {
    const response = await axios.post('/api/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    // Store tokens
    authUtils.setTokens(accessToken, refreshToken);
    
    // Store user data in state/context
    setUser(user);
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.response.data.message };
  }
};
```

### 3. Logout
```javascript
const logout = async () => {
  try {
    // Call logout endpoint to clear refresh token
    await axios.post('/api/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local tokens
    authUtils.clearTokens();
    setUser(null);
  }
};
```

### 4. Check Authentication Status
```javascript
const checkAuth = async () => {
  if (!authUtils.isLoggedIn()) {
    return false;
  }

  try {
    const response = await axios.get('/api/verify-token');
    setUser(response.data.user);
    return true;
  } catch (error) {
    authUtils.clearTokens();
    return false;
  }
};
```

### 5. Making Protected Requests
```javascript
// Tokens are automatically attached by interceptors
const createItem = async (itemData) => {
  try {
    const response = await axios.post('/api/items', itemData);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message);
  }
};
```

## Security Features

### 1. Token Expiration
- **Access Token**: 24 hours (configurable via JWT_EXPIRES_IN)
- **Refresh Token**: 7 days (configurable via REFRESH_TOKEN_EXPIRES_IN)

### 2. Automatic Token Refresh
- Tokens are automatically refreshed when they expire
- Seamless user experience without forced re-login

### 3. Token Validation
- All protected routes verify token signature and expiration
- Invalid or expired tokens result in 401/403 responses

### 4. Route Protection
- Users can only access their own data (items, messages, profile)
- Ownership validation for item operations
- Authorization checks for all sensitive operations

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
```

## Database Changes

The following column has been added to support JWT authentication:

```sql
-- Add refresh_token column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;
```

## Benefits of JWT Authentication

1. **Stateless**: No server-side session storage required
2. **Scalable**: Works well with load balancers and multiple servers
3. **Secure**: Tokens are signed and can be verified independently
4. **Flexible**: Easy to add custom claims and permissions
5. **Mobile-Friendly**: Perfect for mobile app authentication

## Migration Guide

### For Existing Frontend Code

1. **Install the auth utilities**: Use the provided `auth.js` file
2. **Update login**: Store tokens after successful login
3. **Add interceptors**: Setup axios interceptors for automatic token handling
4. **Update API calls**: Remove manual user_id parameters from requests
5. **Add logout**: Implement proper logout functionality

### Example Migration

**Before (without JWT):**
```javascript
const response = await axios.post('/api/items', {
  title: 'Book',
  description: 'Great book',
  user_id: user.id  // Manual user ID
});
```

**After (with JWT):**
```javascript
// user_id is automatically extracted from JWT token
const response = await axios.post('/api/items', {
  title: 'Book',
  description: 'Great book'
  // No user_id needed - comes from token
});
```

## Testing the Authentication

1. **Test Login**: Verify tokens are returned and stored
2. **Test Protected Routes**: Ensure unauthorized requests fail
3. **Test Token Refresh**: Verify automatic token renewal works
4. **Test Logout**: Confirm tokens are cleared properly
5. **Test Ownership**: Verify users can only access their own data

This implementation provides a robust, secure, and user-friendly authentication system for your college marketplace application.
