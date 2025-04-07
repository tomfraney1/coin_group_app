"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const database_1 = require("./config/database");
const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
async function testHealthCheck() {
    try {
        console.log('\n🔍 Testing Health Check...');
        const response = await axios_1.default.get(`${BASE_URL}/health`);
        console.log('✅ Health Check Response:', response.data);
    }
    catch (error) {
        console.error('❌ Health Check Failed:', error);
    }
}
async function testAuthentication() {
    try {
        console.log('\n🔍 Testing Authentication...');
        // Test login with existing user
        const loginResponse = await axios_1.default.post(`${BASE_URL}/auth/login`, {
            email: 'tom@ommni.io',
            password: 'password123'
        });
        authToken = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('Token:', authToken);
        // Test getting current user
        const meResponse = await axios_1.default.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Current user:', meResponse.data);
    }
    catch (error) {
        console.error('❌ Authentication Test Failed:', error);
    }
}
async function testUserManagement() {
    try {
        console.log('\n🔍 Testing User Management...');
        // Test getting all users
        const usersResponse = await axios_1.default.get(`${BASE_URL}/users`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Users list:', usersResponse.data);
    }
    catch (error) {
        console.error('❌ User Management Test Failed:', error);
    }
}
async function testCoinLocationManagement() {
    try {
        console.log('\n🔍 Testing Coin Location Management...');
        // Test getting location counts
        const countsResponse = await axios_1.default.get(`${BASE_URL}/coin-locations/counts`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Location counts:', countsResponse.data);
        // Test getting coins by location
        const locationResponse = await axios_1.default.get(`${BASE_URL}/coin-locations/location/UCB`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Coins in UCB:', locationResponse.data);
    }
    catch (error) {
        console.error('❌ Coin Location Management Test Failed:', error);
    }
}
async function runAllTests() {
    try {
        console.log('🚀 Starting API Tests with New Database...');
        await testHealthCheck();
        await testAuthentication();
        await testUserManagement();
        await testCoinLocationManagement();
        console.log('\n✨ All tests completed!');
    }
    catch (error) {
        console.error('❌ Test suite failed:', error);
    }
    finally {
        await database_1.pool.end();
    }
}
runAllTests();
