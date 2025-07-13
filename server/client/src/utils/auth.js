// Authentication utilities for JWT token management

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const authUtils = {
  // Store tokens in localStorage
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  // Get access token
  getAccessToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get refresh token
  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Remove tokens (logout)
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Get authorization headers for API requests
  getAuthHeaders: () => {
    const token = authUtils.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Decode JWT payload (without verification - for client-side use only)
  decodeToken: (token) => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Check if token is expired (client-side check only)
  isTokenExpired: (token) => {
    const decoded = authUtils.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  },

  // Auto-refresh token if needed
  refreshTokenIfNeeded: async () => {
    const accessToken = authUtils.getAccessToken();
    const refreshToken = authUtils.getRefreshToken();
    
    if (!accessToken || !refreshToken) {
      return false;
    }

    // Check if access token is expired or will expire soon (within 5 minutes)
    const decoded = authUtils.decodeToken(accessToken);
    if (decoded && decoded.exp) {
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = decoded.exp - currentTime;
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 300) {
        try {
          const response = await fetch('/api/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (response.ok) {
            const data = await response.json();
            authUtils.setTokens(data.accessToken, data.refreshToken);
            return true;
          } else {
            // Refresh failed, clear tokens
            authUtils.clearTokens();
            return false;
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
          authUtils.clearTokens();
          return false;
        }
      }
    }

    return true;
  }
};

// Axios interceptor for automatic token attachment and refresh
export const setupAxiosInterceptors = (axios) => {
  // Request interceptor to add token to headers
  axios.interceptors.request.use(
    (config) => {
      const token = authUtils.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token expiration
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = authUtils.getRefreshToken();
          if (refreshToken) {
            const response = await fetch('/api/refresh-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
              const data = await response.json();
              authUtils.setTokens(data.accessToken, data.refreshToken);
              
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
              return axios(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }

        // If refresh fails, clear tokens and redirect to login
        authUtils.clearTokens();
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }
  );
};
