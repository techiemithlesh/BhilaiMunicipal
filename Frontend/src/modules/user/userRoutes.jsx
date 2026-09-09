import { Suspense } from "react";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import UserList from "./pages/UserList";
import Profile from "./pages/Profile";
import { Route, Routes } from "react-router-dom";

function UserRoutes() {
  return (
    <>
      <Suspense fallback={<div className="loading">Loading....</div>}>
        <Routes>
          <Route
            path="/list/:userType"
            element={
              <ProtectedRoute>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default UserRoutes;
