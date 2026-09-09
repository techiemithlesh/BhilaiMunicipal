import { Navigate } from "react-router-dom";
import { clearAuth, isAuthenticated } from "../../utils/auth";

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    clearAuth();
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;
