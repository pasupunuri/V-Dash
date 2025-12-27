import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const user = useAuthStore(state => state.user);

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified, check if user has the required role
  if (allowedRoles && Array.isArray(allowedRoles)) {
    const userRole = user?.role || 'employee';
    if (!allowedRoles.includes(userRole)) {
      // Redirect to home/dashboard if user doesn't have required role
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;