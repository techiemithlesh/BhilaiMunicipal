import { clearAuth, isCitizenAuthenticated } from '../../utils/auth';
import { Navigate } from 'react-router-dom';

function ProtectedRouteCitizen({ children }) {
    console.log("isCitizenAuthenticated",isCitizenAuthenticated());
    if (!isCitizenAuthenticated()) {
        clearAuth();
        return <Navigate to="/citizen/auth" />;
    }
    return children;
}

export default ProtectedRouteCitizen
