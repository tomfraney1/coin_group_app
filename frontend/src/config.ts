export const isDevelopment = import.meta.env.DEV;

export const developmentUser = {
  id: 'dev-user-id',
  username: 'Development Admin',
  email: 'dev@localhost',
  role: 'admin',
};

// Use different API URLs for development and production
export const API_URL = isDevelopment
  ? 'http://localhost:3000/api'  // Development URL
  : 'https://d30ph5p0cjfaop.cloudfront.net/api';  // Production URL 