import api from './axios';

// Create a booking (student only)
export const createBooking = async (data) => {
  const response = await api.post('/bookings', data);
  return response.data;
};

// Get student's bookings
export const getMyBookings = async () => {
  const response = await api.get('/bookings/me');
  return response.data;
};

// Get driver's bookings
export const getDriverBookings = async () => {
  const response = await api.get('/bookings/driver');
  return response.data;
};

// Cancel a booking (student only)
export const cancelBooking = async (id) => {
  const response = await api.put(`/bookings/${id}/cancel`);
  return response.data;
};

// Confirm a booking (driver only)
export const confirmBooking = async (id) => {
  const response = await api.put(`/bookings/${id}/confirm`);
  return response.data;
};

// Reject a booking (driver only)
export const rejectBooking = async (id) => {
  const response = await api.put(`/bookings/${id}/reject`);
  return response.data;
};
