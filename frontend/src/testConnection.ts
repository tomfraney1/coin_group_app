import { apiService } from './services/api';

async function testConnection() {
  try {
    console.log('Testing backend connection...');
    const response = await fetch('https://coin-group-backend-854749062131.us-central1.run.app/api/health');
    const data = await response.json();
    console.log('Backend health check response:', data);
    return data;
  } catch (error) {
    console.error('Error testing backend connection:', error);
    throw error;
  }
}

// Run the test
testConnection()
  .then(() => console.log('Backend connection test completed'))
  .catch(() => console.error('Backend connection test failed')); 