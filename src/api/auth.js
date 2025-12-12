import api from './axios';

// Student Auth
export const registerStudent = async (data) => {
  const response = await api.post('/auth/student/register', data);
  return response.data;
};

export const loginStudent = async (data) => {
  const response = await api.post('/auth/student/login', data);
  return response.data;
};

// Driver Auth
export const registerDriver = async (data) => {
  const response = await api.post('/auth/driver/register', data);
  return response.data;
};

export const loginDriver = async (data) => {
  const response = await api.post('/auth/driver/login', data);
  return response.data;
};

// Save notification token
export const saveNotificationToken = async (token) => {
  const response = await api.put('/auth/notification-token', { token });
  return response.data;
};

// Get current user profile (fresh from database)
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
