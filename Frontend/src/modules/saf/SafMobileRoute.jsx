import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import MobileProtectedRoute from "../../components/common/MobileProtectedRoute";
import Inbox from "./pages/Inbox";
import Wf from "./pages/Wf";
import FieldVerification from "./components/FieldVerification";
import GeoTagImageUpload from "./pages/mobile/GeoTagImageUpload";

function SafMobileRoute() {
  return (
    <>
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-8 h-8 animate-spin loader"></span>
            <p className="mt-2">Loading...</p>
          </div>
        }
      >
        <Routes>
          <Route
            path="/inbox"
            element={
              <MobileProtectedRoute>
                <Inbox />
              </MobileProtectedRoute>
            }
          />
          <Route
            path="/verification/:safDtlId"
            element={
              <MobileProtectedRoute>
                <FieldVerification />
              </MobileProtectedRoute>
            }
          />

          <Route
            path="/geoTag/:safDtlId"
            element={
              <MobileProtectedRoute>
                <GeoTagImageUpload />
              </MobileProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default SafMobileRoute;
