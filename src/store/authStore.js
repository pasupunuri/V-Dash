import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode'; // Changed from default import to named import

// Auth Store with Zustand
export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || {},
  token: localStorage.getItem('authToken') || null,

  login: (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({ token, user: userData });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedHotel');  // Clear selected property on logout
    set({ token: null, user: null });
  },

  isLoggedIn: () => !!localStorage.getItem('authToken'),
}));



export const handleOAuthLoginSuccess = (accessToken) => {
  try {
    // Store the token
    localStorage.setItem('authToken', accessToken);
    
    // Parse the JWT token to extract user info
    const userInfo = jwtDecode(accessToken); // Changed from jwt_decode to jwtDecode
    
    // Store the user info
    localStorage.setItem('user', JSON.stringify(userInfo));
    
    // Update the store
    useAuthStore.getState().login(accessToken, userInfo);
    
    return userInfo;
  } catch (error) {
    console.error('OAuth login processing failed:', error);
    throw error;
  }
};

export const logout = () => {
  useAuthStore.getState().logout();
};
