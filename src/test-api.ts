import axios from 'axios';
import { pool } from './config/database';

interface AuthResponse {
  token: string;
  user: {
    id: string | number;
    username: string;
    email: string;
    role: string;
  };
}

interface ApiResponse<T> {
  data: T;
}

const BASE_URL = 'https://coingroup-backend-854749062131.us-central1.run.app/api';
let authToken = '';

// Generate unique credentials for testing
const timestamp = Date.now();
const uniqueEmail = `test${timestamp}@example.com`;
const uniqueUsername = `testuser${timestamp}`;
const testPassword = 'testpassword123';

async function testHealthCheck() {
  try {
    console.log('\n🔍 Testing Health Check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check Response:', response.data);
  } catch (error: any) {
    console.error('❌ Health Check Failed:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

async function testAuthEndpoints() {
  try {
    console.log('\n🔍 Testing Authentication Endpoints...');
    
    // Test registration
    console.log('\nTesting registration...');
    console.log('Using test credentials:', { email: uniqueEmail, username: uniqueUsername });
    const registerResponse = await axios.post<AuthResponse>(`${BASE_URL}/auth/register`, {
      username: uniqueUsername,
      email: uniqueEmail,
      password: testPassword,
      role: 'user'
    });
    console.log('✅ Registration Response:', registerResponse.data);
    authToken = registerResponse.data.token;
    
    // Test login
    console.log('\nTesting login...');
    const loginResponse = await axios.post<AuthResponse>(`${BASE_URL}/auth/login`, {
      email: uniqueEmail,
      password: testPassword
    });
    console.log('✅ Login Response:', loginResponse.data);
    authToken = loginResponse.data.token;
    
    // Test get current user
    console.log('\nTesting get current user...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Current User Response:', meResponse.data);
    
  } catch (error: any) {
    console.error('❌ Authentication Tests Failed:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

async function testUserEndpoints() {
  try {
    console.log('\n🔍 Testing User Endpoints...');
    
    if (!authToken) {
      console.log('⚠️ No auth token available. Skipping user endpoints test.');
      return;
    }
    
    // Test get current user profile
    const response = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ User Profile Response:', response.data);
    
  } catch (error: any) {
    console.error('❌ User Endpoints Tests Failed:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

async function testCoinLocationEndpoints() {
  try {
    console.log('\n🔍 Testing Coin Location Endpoints...');
    
    if (!authToken) {
      console.log('⚠️ No auth token available. Skipping coin location endpoints test.');
      return;
    }
    
    // Test get location counts
    console.log('\nTesting get location counts...');
    const countsResponse = await axios.get(`${BASE_URL}/coin-locations/counts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Location Counts Response:', countsResponse.data);

    // Test assign coin to location
    console.log('\nTesting assign coin to location...');
    const testCoinId = `TEST_COIN_${timestamp}`;
    const assignResponse = await axios.post(`${BASE_URL}/coin-locations/assign`, {
      coinId: testCoinId,
      location: 'UCB'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Assign Coin Response:', assignResponse.data);

    // Test get coin location
    console.log('\nTesting get coin location...');
    const locationResponse = await axios.get(`${BASE_URL}/coin-locations/${testCoinId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Coin Location Response:', locationResponse.data);

    // Test get location history
    console.log('\nTesting get location history...');
    const historyResponse = await axios.get(`${BASE_URL}/coin-locations/${testCoinId}/history`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Location History Response:', historyResponse.data);

    // Test get coins by location
    console.log('\nTesting get coins by location...');
    const coinsResponse = await axios.get(`${BASE_URL}/coin-locations/location/UCB`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Coins by Location Response:', coinsResponse.data);
    
  } catch (error: any) {
    console.error('❌ Coin Location Endpoints Tests Failed:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Tests...');
  
  await testHealthCheck();
  await testAuthEndpoints();
  await testUserEndpoints();
  await testCoinLocationEndpoints();
  
  console.log('\n✨ All tests completed!');
  
  // Close the database pool
  await pool.end();
}

runAllTests().catch(console.error); 