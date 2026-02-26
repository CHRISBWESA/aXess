// src/config/api.config.ts
// API Configuration

// Change this URL based on your environment
export const API_CONFIG = {
  // For local development
  development: 'http://localhost:5000',
  
  // For production - change this to your production API URL
  production: 'https://your-production-api.com',
  
  // For staging
  staging: 'https://your-staging-api.com'
};

// Detect environment and get the right API URL
const getEnvironment = (): 'development' | 'production' | 'staging' => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('staging')) {
    return 'staging';
  } else {
    return 'production';
  }
};

export const API_BASE_URL = API_CONFIG[getEnvironment()];

// Alternative: You can also manually set which environment to use
// export const API_BASE_URL = API_CONFIG.development;