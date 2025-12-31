import { api } from '@/store/api';

export const userApi = {
  // Get users with pagination and search (admin only)
  getUsers: async (page = 1, pageSize = 20, search = '') => {
    const response = await api.get('auth/users', {
      params: { page, page_size: pageSize, search }
    });
    return response.data || { users: [], total: 0, page: 1, page_size: pageSize, total_pages: 0 };
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

  // Update user password (admin only)
  updateUserPassword: async (userId, newPassword) => {
    const response = await api.patch(`auth/users/${userId}/password`, { new_password: newPassword });
    return response.data;
  },

  // Update own password (any user)
  updateOwnPassword: async (currentPassword, newPassword) => {
    const response = await api.patch('auth/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};
