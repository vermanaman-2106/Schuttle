import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this with your backend URL
// For iOS Simulator: use http://localhost:5001/api
// For Android Emulator: use http://10.0.2.2:5001/api
// For Physical Device: use http://YOUR_COMPUTER_IP:5001/api
// Your detected IP: 192.168.1.54 (update if changed)
// To find your IP: On Mac/Linux run: ifconfig | grep "inet " | grep -v 127.0.0.1
// On Windows run: ipconfig and look for IPv4 Address
// NOTE: Port changed to 5001 because macOS uses port 5000 for AirPlay
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.54:5001/api' // ⚠️ Use your computer's IP for physical device, localhost for simulator
  : 'http://YOUR_IP_ADDRESS:5001/api'; // Change this for production

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout (increased for bcrypt hashing during registration)
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
    return Promise.reject(error);
  }
);

export default api;
