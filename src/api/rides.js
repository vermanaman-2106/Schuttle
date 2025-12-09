import api from './axios';

// Get all rides (with optional filters)
export const getRides = async (params) => {
  const response = await api.get('/rides', { params });
  return response.data;
};

// Get single ride by ID
export const getRideById = async (id) => {
  const response = await api.get(`/rides/${id}`);
  return response.data;
};

// Create a new ride (driver only)
export const createRide = async (data) => {
  const response = await api.post('/rides', data);
  return response.data;
};

// Get driver's rides
export const getDriverRides = async () => {
  const response = await api.get('/rides/driver/rides');
  return response.data;
};

// Update ride (driver only)
export const updateRide = async (id, data) => {
  const response = await api.put(`/rides/${id}`, data);
  return response.data;
};

// Delete ride (driver only)
export const deleteRide = async (id) => {
  const response = await api.delete(`/rides/${id}`);
  return response.data;
};

// Confirm ride (driver only)
export const confirmRide = async (id) => {
  const response = await api.put(`/rides/${id}/confirm`);
  return response.data;
};
