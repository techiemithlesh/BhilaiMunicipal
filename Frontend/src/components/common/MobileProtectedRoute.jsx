import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../utils/auth";

function MobileProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login/mobile" />;
  }

  return children;
}

export default MobileProtectedRoute;
