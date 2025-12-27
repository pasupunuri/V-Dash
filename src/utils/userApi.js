import { api } from '@/store/api';

export const userApi = {
  // Get all users (admin only)
  getUsers: async () => {
    const response = await api.get('auth/users');
    return response.data || [];
  },

  // Create a new user (admin only)
  createUser: async (userData) => {
    const response = await api.post('auth/users', userData);
    return response.data;
  },

  // Update user details (admin only)
  updateUser: async (userId, userData) => {
    const response = await api.put(`auth/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`auth/users/${userId}`);
    return response.data;
  },

  // Toggle user status (admin only)
  toggleUserStatus: async (userId, status) => {
    const response = await api.patch(`auth/users/${userId}/status`, { status });
    return response.data;
  },

  // Update user properties (admin only)
  updateUserProperties: async (userId, propertyIds) => {
    const response = await api.put(`auth/users/${userId}/properties`, { property_ids: propertyIds });
    return response.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('auth/me');
    return response.data;
  },
};
