import axios from 'axios';

// Dynamically use relative path for client or local port 3000 mapping for server environments
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://localhost:3000/api';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper utility to inspect token expiration status from client memory
const isTokenExpiringSoon = (): boolean => {
  const expirationTime = localStorage.getItem('oauth_token_expires_at');
  if (!expirationTime) return true;
  
  // Check if token expires within a safe 2-minute (120000ms) structural buffer window
  return Date.now() + 120000 > parseInt(expirationTime, 10);
};

// Global Outbound Request Interceptor Pipeline
api.interceptors.request.use(
  async (config) => {
    // Check if the current Google Workspace token session requires a refresh
    if (isTokenExpiringSoon()) {
      console.log('OAuth access code expiration window detected. Initiating background refresh...');
      
      try {
        const refreshToken = localStorage.getItem('oauth_refresh_token');
        
        if (refreshToken) {
          // Silently request a new access token from your background configuration
          const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, expiresIn } = response.data;
          const newExpirationTimestamp = Date.now() + (expiresIn || 3600) * 1000;

          // Commit updated credentials securely back to memory storage nodes
          localStorage.setItem('oauth_access_token', accessToken);
          localStorage.setItem('oauth_token_expires_at', newExpirationTimestamp.toString());

          // Patch the updated header directly into the active configuration stream
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        } else {
          // In simulated or first-time setup, load active mock or pop tokens securely
          const currentToken = localStorage.getItem('oauth_access_token') || 'authorized_workspace_access_token_vjathin';
          config.headers['Authorization'] = `Bearer ${currentToken}`;
        }
      } catch (error) {
        console.error('Asynchronous token refresh bottleneck encountered:', error);
        
        // Pass the existing token as a backup fallback to prevent pipeline blocks
        const currentToken = localStorage.getItem('oauth_access_token') || 'authorized_workspace_access_token_vjathin';
        config.headers['Authorization'] = `Bearer ${currentToken}`;
      }
    } else {
      // Token is fresh; append current access key to the header block safely
      const currentToken = localStorage.getItem('oauth_access_token') || 'authorized_workspace_access_token_vjathin';
      config.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
