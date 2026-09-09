import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import CollectionReports from "./pages/CollectionReports";
import PaymentModeSummary from "./pages/PaymentModeSummary";
import LevelWisePendingSaf from "./pages/LevelWisePendingSaf";
import SafPendingList from "./pages/SafPendingList";
import RoleUserWisePendingSaf from "./pages/RoleUserWisePendingSaf";
import WardWiseDcb from "./pages/WardWiseDcb";
import PropertyWiseDcb from "./pages/PropertyWiseDcb";
import DateWiseApplySaf from "./pages/DateWiseApplySaf";
import MonthWiseCreatedProp from "./pages/MonthWiseCreatedProp";

function ReportRoute() {
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
            path="/collection"
            element={
              <ProtectedRoute>
                <CollectionReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/mode/summary"
            element={
              <ProtectedRoute>
                <PaymentModeSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/level/wise/pending"
            element={
              <ProtectedRoute>
                <LevelWisePendingSaf />
              </ProtectedRoute>
            }
          />
          <Route
            path="/level/user/pending"
            element={
              <ProtectedRoute>
                <SafPendingList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/level/user/wise/pending"
            element={
              <ProtectedRoute>
                <RoleUserWisePendingSaf />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ward/wise/dcb"
            element={
              <ProtectedRoute>
                <WardWiseDcb />
              </ProtectedRoute>
            }
          />
          <Route
            path="/holding/wise/dcb"
            element={
              <ProtectedRoute>
                <PropertyWiseDcb />
              </ProtectedRoute>
            }
          />
          <Route
            path="/date/wise/apply"
            element={
              <ProtectedRoute>
                <DateWiseApplySaf />
              </ProtectedRoute>
            }
          />

          <Route
            path="/month/wise/created-prop"
            element={
              <ProtectedRoute>
                <MonthWiseCreatedProp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default ReportRoute;
