import SafMobileRoute from "./modules/saf/SafMobileRoute";
import MobileLayout from "./layout/MobileLayout";
import { Route, Routes } from "react-router-dom";
import MobileProtectedRoute from "./components/common/MobileProtectedRoute";

function MobileRoutes() {
  return (
    <MobileLayout>
      <Routes>
        <Route
          path="/saf/*"
          element={
            <MobileProtectedRoute>
              <SafMobileRoute />
            </MobileProtectedRoute>
          }
        />
      </Routes>
    </MobileLayout>
  );
}

export default MobileRoutes;
