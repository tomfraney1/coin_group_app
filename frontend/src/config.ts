export const isDevelopment = import.meta.env.DEV;

// Ensure we're using the correct API URL based on the environment
export const API_URL = import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:3000/api' : 'https://coingroup-backend-854749062131.us-central1.run.app/api');

export const developmentUser = {
  id: 'dev-user-id',
  username: 'Development Admin',
  email: 'dev@localhost',
  role: 'admin',
}; 