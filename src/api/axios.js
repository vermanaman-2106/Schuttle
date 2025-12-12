import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend URL configuration
// Since backend is deployed on Render, we'll use Render URL by default
// To use local backend for development, set USE_LOCAL=true
const USE_LOCAL = false; // Set to true to use local backend (http://YOUR_IP:5001/api)
const API_BASE_URL = (__DEV__ && USE_LOCAL)
  ? 'http://192.168.1.54:5001/api' // ⚠️ Use your computer's IP for physical device, localhost for simulator
  : 'https://schuttle-backend.onrender.com/api'; // Production: Render deployment

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout (increased for Render cold starts and bcrypt hashing)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // You can dispatch a logout action here if using Redux/Zustand
    }
    
    // Handle 502 Bad Gateway (Render cold start or server down)
    if (error.response?.status === 502) {
      // Transform 502 error to have a more user-friendly message
      error.userFriendlyMessage = 'Server is temporarily unavailable. This might be due to a cold start. Please try again in a few seconds.';
    }
    
    // Handle 503 Service Unavailable
    if (error.response?.status === 503) {
      error.userFriendlyMessage = 'Service is temporarily unavailable. Please try again in a moment.';
    }
    
    // Handle network errors
    if (!error.response && error.message) {
      if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        error.userFriendlyMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        error.userFriendlyMessage = 'Request timed out. The server might be starting up. Please try again.';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
